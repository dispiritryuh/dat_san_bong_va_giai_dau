// service/admin.service.ts

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('chưa đăng nhập!');

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
    console.error("Lỗi trả về từ backend:", textData);
    throw new Error('API sai đường dẫn hoặc backend sập');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Lỗi xử lý từ máy chủ');
  }

  return data;
};
// doanh thu
export const getRevenueApi = async (fromDate: string, inDate: string, type: 'hour' | 'day' | 'month') => {
  const url = `http://localhost:8080/api/admin/revenue?fromDate=${fromDate}&inDate=${inDate}&type=${type}`;
  return await fetchWithAuth(url, { method: 'GET' });
};

// them san moi
export const createPitchApi = async (name: string, basePrice: number) => {
  return await fetchWithAuth('http://localhost:8080/api/admin/createPitch', {
    method: 'POST',
    body: JSON.stringify({ name, basePrice })
  });
};

//doi gia san
export const changePitchPriceApi = async (pitchId: number, newPrice: number) => {
  return await fetchWithAuth('http://localhost:8080/api/admin/pitch/price', {
    method: 'PUT', 
    body: JSON.stringify({ pitchId, newPrice }) 
  });
};

// trang thai san
export const changePitchStatusApi = async (pitchId: number, newStatus: string) => {
  return await fetchWithAuth('http://localhost:8080/api/admin/pitch/status', {
    method: 'PUT',
    body: JSON.stringify({ pitchId, newStatus }) 
  });
};
// lay toan bo san
export const getAllPitchesApi = async () => {
  return await fetchWithAuth('http://localhost:8080/api/admin/getallPitch', { 
    method: 'GET' 
  });
};