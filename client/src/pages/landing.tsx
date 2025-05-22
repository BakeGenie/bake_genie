import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Cake, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Mail, 
  ChevronRight, 
  CreditCard,
  BarChart4,
  Users,
  Menu,
  X
} from "lucide-react";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center">
            <img
              src="https://placehold.co/40x40/e2e8f0/475569?text=BD"
              alt="BakeDiary Logo"
              className="h-10 w-10 mr-2 rounded-md"
            />
            <span className="text-xl font-semibold text-blue-800 dark:text-blue-400">BakeDiary</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">Home</a>
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">Features</a>
            <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">Pricing</a>
            <a href="#faq" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">FAQs</a>
            <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">Contact Us</a>
            <ThemeToggle />
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              asChild
            >
              <Link to="/login">LOGIN</Link>
            </Button>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-3 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="md:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2">
            <nav className="flex flex-col space-y-3 py-3">
              <a href="#" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </a>
              <a href="#features" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a href="#pricing" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a href="#faq" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQs
              </a>
              <a href="#contact" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact Us
              </a>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white w-full mt-2"
                asChild
              >
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>LOGIN</Link>
              </Button>
            </nav>
          </div>
        )}
      </header>


      {/* Hero Section */}
      <div className="relative bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl uppercase">
                <span className="block text-blue-700 dark:text-blue-400">CAKE PRICING &</span>
                <span className="block text-blue-700 dark:text-blue-400">ORDER MANAGEMENT</span>
                <span className="block text-blue-700 dark:text-blue-400">SOFTWARE APP</span>
              </h1>
              <p className="mt-6 max-w-lg text-gray-600 dark:text-gray-300 text-lg">
                Bake Diary is the leading cloud based software for Cake Decorators & Bakers all over the world to help manage the admin side of your cake business.
              </p>
              <div className="mt-8">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white uppercase shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  FIND OUT MORE
                </Button>
              </div>
              <div className="mt-6 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <p>* 2 week free trial for all new users.</p>
                <p>** Subscription after free trial is $4.95 pm / €5.50 pm</p>
                <p>*** We currently support over 37 currencies incl. USD, AUD, GBP, CAD & EUR</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <img
                src="/attached_assets/home_baker@2x.jpg"
                alt="Baker working in kitchen"
                className="relative h-auto w-full object-cover rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* What is Bake Diary Section */}
      <div id="features" className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative rounded-xl overflow-hidden shadow-2xl group transition-all duration-300 hover:shadow-blue-200/50 dark:hover:shadow-blue-900/20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img
                  src="https://placehold.co/600x400/e2e8f0/475569?text=Dashboard+Preview"
                  alt="BakeDiary Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-6">What is Bake Diary?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                Bake Diary is an online web application created to help cake decorators 
                and home bakers easily manage the important day to day tasks associated 
                with running a successful home or small baking business.
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mt-1">
                    <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Streamline Orders</h3>
                    <p className="text-gray-600 dark:text-gray-300">Keep track of all your orders in one place with our intuitive interface</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mt-1">
                    <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Manage Your Calendar</h3>
                    <p className="text-gray-600 dark:text-gray-300">Never double-book or overcommit again with visual scheduling tools</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mt-1">
                    <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Track Finances</h3>
                    <p className="text-gray-600 dark:text-gray-300">Monitor income, expenses, and profitability with detailed reporting</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 sm:text-4xl">
              Everything You Need to Run Your Bakery
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Streamline your operations, save time, and grow your baking business
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl bg-white dark:bg-gray-900 p-8 shadow-lg dark:shadow-blue-900/5 border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-blue-900/10 transition-all duration-300 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-800 text-white shadow-md group-hover:shadow-blue-500/20 transition-all duration-300">
                <Cake className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">Order Management</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Track orders, quotes, and custom requests. Manage order statuses from inquiry to delivery with our intuitive dashboard.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl bg-white dark:bg-gray-900 p-8 shadow-lg dark:shadow-purple-900/5 border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-purple-900/10 transition-all duration-300 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-800 text-white shadow-md group-hover:shadow-purple-500/20 transition-all duration-300">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">Calendar & Scheduling</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Visual calendar for production planning. Avoid overbooking and manage your time efficiently with color-coded events.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl bg-white dark:bg-gray-900 p-8 shadow-lg dark:shadow-green-900/5 border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-green-900/10 transition-all duration-300 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-800 text-white shadow-md group-hover:shadow-green-500/20 transition-all duration-300">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">Payment Processing</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Accept deposits and payments online. Connect with Stripe or Square for secure transactions and automatic invoicing.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl bg-white dark:bg-gray-900 p-8 shadow-lg dark:shadow-yellow-900/5 border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-yellow-900/10 transition-all duration-300 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700 text-white shadow-md group-hover:shadow-yellow-500/20 transition-all duration-300">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">Recipe Management</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Store and organize recipes, calculate costs, and scale ingredients for any order size with our powerful recipe tools.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl bg-white dark:bg-gray-900 p-8 shadow-lg dark:shadow-red-900/5 border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-red-900/10 transition-all duration-300 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-800 text-white shadow-md group-hover:shadow-red-500/20 transition-all duration-300">
                <BarChart4 className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">Business Insights</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Track expenses, revenue, and profit margins. Generate detailed reports to analyze and grow your business.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl bg-white dark:bg-gray-900 p-8 shadow-lg dark:shadow-teal-900/5 border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-teal-900/10 transition-all duration-300 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-800 text-white shadow-md group-hover:shadow-teal-500/20 transition-all duration-300">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">Customer Management</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Build a comprehensive customer database with order history, preferences, and communication logs for better relationships.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white dark:bg-gray-900 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              How BakeDiary Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Streamline your workflow in just a few simple steps
            </p>
          </div>

          <div className="mt-20 flow-root">
            <ul className="grid grid-cols-1 gap-12 md:grid-cols-3">
              <li className="relative flex flex-col items-center text-center group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-25 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white text-2xl font-bold shadow-xl">
                  1
                </div>
                <div className="relative w-px h-12 bg-gradient-to-b from-blue-500 to-transparent mt-6"></div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Capture Orders</h3>
                <p className="mt-3 text-base text-gray-600 dark:text-gray-300 max-w-md">
                  Easily log customer details, order requirements, and delivery dates in one place with our intuitive order forms.
                </p>
                <div className="mt-6">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400 inline-flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" /> Customer-friendly forms
                  </div>
                </div>
              </li>
              
              <li className="relative flex flex-col items-center text-center group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-0 group-hover:opacity-25 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 text-white text-2xl font-bold shadow-xl">
                  2
                </div>
                <div className="relative w-px h-12 bg-gradient-to-b from-purple-500 to-transparent mt-6"></div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Manage Production</h3>
                <p className="mt-3 text-base text-gray-600 dark:text-gray-300 max-w-md">
                  Plan your production schedule, track ingredients, and manage team tasks efficiently with our visual calendar.
                </p>
                <div className="mt-6">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-700 dark:text-purple-400 inline-flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" /> Visual scheduling tools
                  </div>
                </div>
              </li>
              
              <li className="relative flex flex-col items-center text-center group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg blur opacity-0 group-hover:opacity-25 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-600 dark:from-green-600 dark:to-teal-700 text-white text-2xl font-bold shadow-xl">
                  3
                </div>
                <div className="relative w-px h-12 bg-gradient-to-b from-green-500 to-transparent mt-6"></div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Get Paid Faster</h3>
                <p className="mt-3 text-base text-gray-600 dark:text-gray-300 max-w-md">
                  Send professional invoices and enable online payments through Stripe or Square to improve your cash flow.
                </p>
                <div className="mt-6">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400 inline-flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" /> Secure payment processing
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Loved by Bakers Everywhere
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              See why bakery owners choose BakeDiary to grow their business
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <div className="absolute -top-2 -left-2 text-blue-600 dark:text-blue-400 text-5xl opacity-20">"</div>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-white font-bold shadow-md">
                    SW
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">Sarah Williams</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Custom Cake Creator</p>
                  </div>
                </div>
                <p className="mt-6 text-gray-600 dark:text-gray-300 relative z-10">
                  "BakeDiary has transformed how I manage my custom cake business. I can track orders, 
                  schedule production, and handle payments all in one place. It's saved me hours of admin work!"
                </p>
                <div className="mt-6 flex text-yellow-400">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                  MJ
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Michael Johnson</h4>
                  <p className="text-sm text-gray-600">Artisan Bakery Owner</p>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                "The recipe cost calculator is a game-changer. I finally know exactly how much each product costs 
                to make, which has helped me price more accurately and increase my profit margins."
              </p>
              <div className="mt-4 flex text-yellow-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                  LC
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Lisa Chen</h4>
                  <p className="text-sm text-gray-600">Home-Based Baker</p>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                "As a home baker, I was drowning in spreadsheets and notes. BakeDiary simplified everything 
                and made me look more professional to my customers. The online payment feature has been amazing!"
              </p>
              <div className="mt-4 flex text-yellow-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Starter Plan */}
            <div className="rounded-xl bg-white p-8 shadow-md border border-gray-200 flex flex-col">
              <h3 className="text-lg font-medium text-gray-900">Starter</h3>
              <p className="mt-4 text-sm text-gray-600">Perfect for home bakers just getting started</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight text-gray-900">$19</span>
                <span className="ml-1 text-base text-gray-600">/month</span>
              </div>
              <ul className="mt-6 space-y-4 flex-1">
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">Up to 50 orders per month</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">Basic order management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">Recipe calculator</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">Calendar scheduling</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">Email support</span>
                </li>
              </ul>
              <Button variant="outline" className="mt-8" asChild>
                <Link to="/register?plan=starter">Get Started</Link>
              </Button>
            </div>

            {/* Professional Plan */}
            <div className="rounded-xl bg-blue-600 p-8 shadow-md border border-blue-500 flex flex-col relative">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-blue-800 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <h3 className="text-lg font-medium text-white">Professional</h3>
              <p className="mt-4 text-sm text-blue-100">For growing bakery businesses</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight text-white">$39</span>
                <span className="ml-1 text-base text-blue-100">/month</span>
              </div>
              <ul className="mt-6 space-y-4 flex-1">
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-blue-200" />
                  <span className="ml-3 text-sm text-white">Unlimited orders</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-blue-200" />
                  <span className="ml-3 text-sm text-white">Advanced order management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-blue-200" />
                  <span className="ml-3 text-sm text-white">Recipe & ingredient inventory</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-blue-200" />
                  <span className="ml-3 text-sm text-white">Online payments (Stripe/Square)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-blue-200" />
                  <span className="ml-3 text-sm text-white">Customer database</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-blue-200" />
                  <span className="ml-3 text-sm text-white">Business reports</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-blue-200" />
                  <span className="ml-3 text-sm text-white">Priority support</span>
                </li>
              </ul>
              <Button className="mt-8 bg-white text-blue-600 hover:bg-blue-50" asChild>
                <Link to="/register?plan=professional">Get Started</Link>
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-xl bg-white p-8 shadow-md border border-gray-200 flex flex-col">
              <h3 className="text-lg font-medium text-gray-900">Enterprise</h3>
              <p className="mt-4 text-sm text-gray-600">For established bakeries with multiple staff</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight text-gray-900">$79</span>
                <span className="ml-1 text-base text-gray-600">/month</span>
              </div>
              <ul className="mt-6 space-y-4 flex-1">
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">Everything in Professional</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">Multiple staff accounts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">Advanced analytics & reporting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">API access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-gray-600">Dedicated account manager</span>
                </li>
              </ul>
              <Button variant="outline" className="mt-8" asChild>
                <Link to="/register?plan=enterprise">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:max-w-xl">
              Ready to Grow Your Bakery Business?
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row lg:mt-0 lg:shrink-0">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
                <Link to="/register">Start Free Trial</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="mt-4 sm:mt-0 sm:ml-4 border-white text-white hover:bg-blue-700"
                asChild
              >
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Product</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Demo</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Updates</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Support</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Help Center</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Tutorials</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Contact</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Company</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">About</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Blog</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Careers</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Press</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Security</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} BakeDiary. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}