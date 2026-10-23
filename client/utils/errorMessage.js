// The message to show for an Apollo error. Server checks that answer with an HTTP error (rate limits:
// 429; rejected requests: 400) arrive as a network error whose body still carries a GraphQL-style
// message, so show that instead of "Response not successful: Received status code 429".
export function errorMessage(error) {
  if (!error) return "";
  const fromServer = error.networkError?.result?.errors?.[0]?.message;
  if (fromServer) return fromServer;
  if (error.networkError?.statusCode === 429) return "Too many requests. Please wait a bit and try again.";
  return error.message;
}
