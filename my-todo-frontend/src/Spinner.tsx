export default function Spinner() {
  return (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
}
