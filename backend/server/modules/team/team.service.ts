import prisma from "../../../prisma/prisma-client";
import Httpexception from "../../model/http-exception.model";

export const createTeam = async (userId: number, input: any) => {
    const { name, description } = input;
    
    // 1. Fix lỗi copy-paste
    if (!name) throw new Httpexception(422, { error: { name: ["can't be blank"] } });
    const existingTeam = await prisma.team.findUnique({
        where: { leaderID: userId }
    });
    if (existingTeam) {
        throw new Httpexception(403, { error: ["!team"] });
    }

    const checkName = await prisma.team.findFirst({
        where: { name: name.trim() }
    });
    if (checkName) {
        throw new Httpexception(422, { error: ['trung ten'] });
    }

    const newTeam = await prisma.team.create({
        data: {
            name: name.trim(),
            description: description,
            leader: {
                connect: { id: userId }
            }
        }
    });
    return newTeam;
}

export const updateTeam = async (userId: number, teamId: number, input: any) => {
    const { name, description } = input;
    
    const checkLead = await prisma.team.findUnique({
        where: { id: teamId },
        include: { leader: true }
    });

    if (!checkLead) throw new Httpexception(404, { error: '!team' });
    if (checkLead.leaderID !== userId) throw new Httpexception(403, { error: "" });

    if (name && name.trim() !== checkLead.name) {
        const checkDuplicateName = await prisma.team.findFirst({
            where: { name: name.trim() }
        });
        if (checkDuplicateName) {
            throw new Httpexception(422, { error: ['trung ten'] });
        }
    }

    const updateTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
            ...(name ? { name: name.trim() } : {}),
            ...(description ? { description } : {}),
        }
    });
    return updateTeam;
}