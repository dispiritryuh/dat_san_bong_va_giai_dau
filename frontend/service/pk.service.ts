
import { fetchWithAuth} from './pitch.service';
const PK_API_URL = `http://localhost:8080/api/pk`;

/**
 * 1. GỬI LỜI THÁCH ĐẤU (POST)
 * Backend cần: opponentIdC, initialMessageC
 */
export const sendChallengeApi = async (opponentIdC: number, initialMessageC: string = "") => {
  const url = `${PK_API_URL}/send`;
  return await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({ opponentIdC, initialMessageC })
  });
};

export const rejectChallengeApi = async (challengeIdC: number, challengerIdC: number) => {
  const url = `${PK_API_URL}/reject`;
  return await fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify({ challengeIdC, challengerIdC })
  });
};

export const cancelChallengeApi = async (challengeIdC: number, opponentIdC: number) => {
  const url = `${PK_API_URL}/cancel`;
  return await fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify({ challengeIdC, opponentIdC })
  });
};

export const acceptChallengeApi = async (challengeIdC: number, challengerIdC: number) => {
  const url = `${PK_API_URL}/accept`;
  return await fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify({ challengeIdC, challengerIdC })
  });
};

export const selectPitchP2PApi = async (
  challengeIdC: number, 
  opponentIdC: number, 
  pitchId: number, 
  startTime: string, 
  endTime: string
) => {
  const url = `${PK_API_URL}/select`;
  const input = {
    pitchId,
    startTime,
    endTime
  };

  return await fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify({ challengeIdC, opponentIdC, input })
  });
};

export const getPkDashboardApi = async () => {
  const url = `${PK_API_URL}/dash`;
  const token = localStorage.getItem('token');
  
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: headers
  });

  const textData = await response.text();
  let data;
  try {
    data = JSON.parse(textData);
  } catch (err) {
    throw new Error('Server Backend trả về dữ liệu không hợp lệ!');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Lỗi lấy dữ liệu PK Dashboard');
  }

  return data;
};