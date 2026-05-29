const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const HEALTH_URL = API_URL .replace('/api/v1', '/health');

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(HEALTH_URL);
    if (!response.ok) return false;
    return (await response.json()).status === 'ok';
  } catch (error) {
    return false;
  }
}


