import { Utensils, Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-12 text-sm">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* <div className="col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="text-primary w-6 h-6" />
            <h2 className="text-xl font-bold tracking-tight text-primary">
              Authentik
            </h2>
          </div>
          <p className="text-gray-500 leading-relaxed">
            Curating the most authentic culinary experiences in Da Nang. From
            hidden alleyways to coastal feasts.
          </p>
        </div> */}
        {/* <div>
          <h4 className="font-bold mb-4 text-[#1c1917] dark:text-white">
            Explore
          </h4>
          <ul className="space-y-2 text-gray-500">
            <li className="hover:text-primary cursor-pointer transition-colors">
              Collections
            </li>
            <li className="hover:text-primary cursor-pointer transition-colors">
              Neighborhoods
            </li>
            <li className="hover:text-primary cursor-pointer transition-colors">
              Best of 2026
            </li>
            <li className="hover:text-primary cursor-pointer transition-colors">
              Street Food Map
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-[#1c1917] dark:text-white">
            Support
          </h4>
          <ul className="space-y-2 text-gray-500">
            <li className="hover:text-primary cursor-pointer transition-colors">
              Help Center
            </li>
            <li className="hover:text-primary cursor-pointer transition-colors">
              Terms of Service
            </li>
            <li className="hover:text-primary cursor-pointer transition-colors">
              Privacy Policy
            </li>
            <li className="hover:text-primary cursor-pointer transition-colors">
              Contact Us
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-[#1c1917] dark:text-white">
            Join Us
          </h4>
          <p className="text-gray-500 mb-4">
            Get the weekly 'Secret Spot' newsletter.
          </p>
          <div className="flex gap-2">
            <input
              className="bg-gray-100 border-none rounded-lg flex-1 px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              placeholder="Email"
              type="email"
            />
            <button className="bg-primary text-white p-2 rounded-lg hover:bg-primary-dark transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div> */}
      </div>
      <div className="max-w-[1200px] mx-auto px-6 mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
        © 2026 Authentik
      </div>
    </footer>
  );
}
