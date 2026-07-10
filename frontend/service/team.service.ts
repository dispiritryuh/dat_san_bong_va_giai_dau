// service/team.service.ts

export const createTeamApi = async (name: string, description: string, token: string) => {
  const response = await fetch('http://localhost:8080/api/team', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ name, description })
  });

  const textData = await response.text();
  
  let data;
  try {
    data = JSON.parse(textData);
  } catch (err) {

    console.log("backend trả về html lỗi", textData);
    throw new Error("API sai đương");
  }
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Lỗi không tạo được đội');
  }

  return data; 
};