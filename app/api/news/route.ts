export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const lang = searchParams.get('lang') || 'en';
  const max = searchParams.get('max') || '50';

  const response = await fetch(
    `https://gnews.io/api/v4/search?q=${query}&lang=${lang}&max=${max}&apikey=b4e1c729cba6efad3b5045497e50cef7`
  );

  const data = await response.json();
  return Response.json(data);
}