function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-12 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">UBT Library</h3>
            <p className="text-sm leading-relaxed max-w-xs">
              A modern library management system empowering students and researchers with seamless access to knowledge.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/home" className="hover:text-emerald-400 transition">Home</a></li>
              <li><a href="/books" className="hover:text-emerald-400 transition">Books Collection</a></li>
              <li><a href="/about" className="hover:text-emerald-400 transition">About Us</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Pristina, Kosovo</li>
              <li>contact@ubt-uni.net</li>
              <li>+383 38 541 400</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
          <p>© {new Date().getFullYear()} UBT Library Management. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex gap-4">
            <span className="hover:text-white cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
