// Small helper to show a success or error banner.
export default function Message({ message }) {
  if (!message) return null;
  return <div className={`message ${message.type}`}>{message.text}</div>;
}
