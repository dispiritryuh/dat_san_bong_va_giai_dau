// services/auth.service.ts
import axios from 'axios'; 
export const registerApi = async (userData: any) => {
  try {
    const response = await axios.post('http://localhost:8080/api/user', { 
      user: userData 
    });
    return response.data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.error 
      ? JSON.stringify(error.response.data.error) 
      : (error.response?.data?.message || error.message || 'Lỗi mạng không xác định!');
      
    throw new Error(errorMsg); 
  }
};

export const loginApi = async (username: string, password: string) => {
  try {
    const response = await axios.post('http://localhost:8080/api/user/login', {
      user: { username, password }
    });
    return response.data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.error 
      ? JSON.stringify(error.response.data.error) 
      : (error.response?.data?.message || error.message || 'Lỗi mạng không xác định!');
      
    throw new Error(errorMsg);
  }
};