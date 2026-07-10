
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('chưa đăng nhập hoặc phiên làm việc đã hết hạn');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, 
      ...options.headers,
    },
  });

  const textData = await response.text();
  let data;
  
  try {
    data = JSON.parse(textData); 
  } catch (err) {
    console.error("Lỗi parse JSON từ Backend:", textData);
    throw new Error('API sai đường dẫn hoặc Server Backend đang sập');
  }

  if (!response.ok) {
    const errorMessage = data.error || data.message || 'Lỗi không xác định từ máy chủ!';
    
    if (typeof errorMessage === 'object' && errorMessage !== null) {
        const errorDetails = Object.values(errorMessage).flat().join(', ');
        throw new Error(errorDetails || 'Dữ liệu gửi lên không hợp lệ!');
    }

    throw new Error(String(errorMessage));
  }

  return data;
};
const API_BASE_URL = 'http://localhost:8080/api'; 

/**

 * @param startTime 
 * @param endTime
 */
export const searchPitchesApi = async (startTime: string, endTime: string) => {
  const url = `${API_BASE_URL}/find?startTime=${startTime}&endTime=${endTime}`;
  return await fetchWithAuth(url, { method: 'GET' });
};


/**
 * @param PitchId 
 * @param startTime 
 * @param endTime 
 */
export const bookPitchApi = async (PitchId: number, startTime: string, endTime: string) => {
  const url = `${API_BASE_URL}/booking`;
  
  return await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({ PitchId, startTime, endTime })
  });
};
export const getUserProfileApi= async () =>{
  const url= `${API_BASE_URL}/getUserProfile`;
  return await fetchWithAuth(url,{
method:'GET'
  });
}