export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Email Spam Tool</h1>
        <div>
          <a href="/" className="mr-4 hover:underline">Home</a>
          <a href="/reports" className="hover:underline">Reports</a>
        </div>
      </div>
    </nav>
  );
}
