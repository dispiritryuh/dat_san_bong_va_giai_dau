import bcrypt from 'bcryptjs';
import { Users } from '@prisma/client';
import Httpexception from '../../model/http-exception.model';
import { RegisterInput } from '../../model/Register-Input.model';
import { RegisteredLogin } from '../../model/Registered-Login.model';
import GenerateToken from '../../share/Generate-Token.share';
import prisma from '../../../prisma/prisma-client';

const CheckUniqueness = async (email: string, username: string) => {
  const exitUserbyEmail = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  const exitUserbyUsername = await prisma.users.findUnique({
    where: { username },
    select: { id: true },
  });

  if (exitUserbyEmail || exitUserbyUsername) {
    throw new Httpexception(422, {
      error: {
        ...(exitUserbyEmail ? { email: ['has already been taken'] } : {}),
        ...(exitUserbyUsername ? { username: ['has already been taken'] } : {}),
      },
    });
  }
};

export const createUser = async (input: RegisterInput): Promise<RegisteredLogin & { hasTeam: boolean, teamInfo: any }> => {
  const email = input?.email?.trim();
  const username = input?.username?.trim();
  const password = input?.password?.trim();

  if (!email) throw new Httpexception(422, { error: { email: ["can't be blank"] } });
  if (!username) throw new Httpexception(422, { error: { username: ["can't be blank"] } });
  if (!password) throw new Httpexception(422, { error: { password: ["can't be blank"] } });

  await CheckUniqueness(email, username);

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = await prisma.users.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  return {
    ...newUser,
    token: GenerateToken(newUser.id, newUser.role),
    hasTeam: false,
    teamInfo: null
  };
};

export const Login = async (inputLogin: any) => {
  const username = inputLogin?.username?.trim();
  const password = inputLogin?.password?.trim();

  if (!username) throw new Httpexception(422, { error: { username: ["can't be blank"] } });
  if (!password) throw new Httpexception(422, { error: { password: ["can't be blank"] } });

  const user = await prisma.users.findUnique({
    where: { username },
    include: { manageTeam: true } 
  });

  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return {
        id:user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        token: GenerateToken(user.id, user.role),
        hasTeam: user.manageTeam ? true : false, 
        teamInfo: user.manageTeam || null 
      };
    }
  }

  throw new Httpexception(403, { error: { "username or password": ['is not valid'] } });
};

export const getCurrentUser = async (id:number) => {
  const user = await prisma.users.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      manageTeam: true, 
    },
  });

  if (!user) {
    throw new Httpexception(404, { error: { user: ['not found'] } });
  }
  const { manageTeam, ...userInfo } = user;

  return {
    ...userInfo,
    hasTeam: manageTeam ? true : false,
    teamInfo: manageTeam || null,
  };
};

export const updateUser = async (userPull: any,id: number) => {
  const { email, username, password } = userPull;

  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const user = await prisma.users.update({
    where: {
    id:id,
    },
    data: {
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
      ...(password ? { password: hashedPassword } : {}),
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
    },
  });

  return {
    ...user,
    token: GenerateToken(user.id, user.role),
  };
};