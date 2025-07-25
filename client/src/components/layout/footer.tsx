import { GraduationCap } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">College Buddy</h3>
            </div>
            <p className="text-sm text-gray-600">
              Your trusted peer-to-peer marketplace and study hub for college students.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <i className="fab fa-instagram text-xl"></i>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/marketplace" className="text-gray-600 hover:text-gray-900">Browse Items</Link></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Sell Items</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Categories</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Safety Tips</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Study Hub</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/notes" className="text-gray-600 hover:text-gray-900">Browse Notes</Link></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Upload Notes</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Study Groups</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Subjects</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Help Center</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-gray-900">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-600">&copy; 2024 College Buddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
