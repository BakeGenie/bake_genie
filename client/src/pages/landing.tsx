import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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
  Users
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                <span className="block">BakeDiary</span>
                <span className="block text-blue-600">Simplify Your Bakery Business</span>
              </h1>
              <p className="mt-6 max-w-lg text-xl text-gray-600">
                The all-in-one management platform designed specifically for bakers, cake makers, and bakery businesses.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  asChild
                >
                  <Link to="/register">Get Started</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-blue-300 text-blue-600"
                  asChild
                >
                  <Link to="/login">Log In</Link>
                </Button>
              </div>
            </div>
            <div className="relative rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
              <div className="overflow-hidden rounded-lg">
                <img
                  src="/dashboard-preview.jpg"
                  alt="BakeDiary Dashboard Preview"
                  className="h-auto w-full rounded-lg object-cover shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x400/e2e8f0/475569?text=BakeDiary+Dashboard";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need to Run Your Bakery
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Streamline your operations, save time, and grow your baking business
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-500 text-white">
                <Cake className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Order Management</h3>
              <p className="mt-2 text-gray-600">
                Track orders, quotes, and custom requests. Manage order statuses from inquiry to delivery.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-purple-500 text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Calendar & Scheduling</h3>
              <p className="mt-2 text-gray-600">
                Visual calendar for production planning. Avoid overbooking and manage your time efficiently.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-500 text-white">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Payment Processing</h3>
              <p className="mt-2 text-gray-600">
                Accept deposits and payments online. Connect with Stripe or Square for secure transactions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-yellow-500 text-white">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Recipe Management</h3>
              <p className="mt-2 text-gray-600">
                Store and organize recipes, calculate costs, and scale ingredients for any order size.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-500 text-white">
                <BarChart4 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Business Insights</h3>
              <p className="mt-2 text-gray-600">
                Track expenses, revenue, and profit margins. Generate reports to analyze your business.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl bg-white p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-teal-500 text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Customer Management</h3>
              <p className="mt-2 text-gray-600">
                Build a customer database with order history, preferences, and communication logs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How BakeDiary Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Streamline your workflow in just a few simple steps
            </p>
          </div>

          <div className="mt-16 flow-root">
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <li className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
                  1
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Capture Orders</h3>
                <p className="mt-2 text-base text-gray-600">
                  Easily log customer details, order requirements, and delivery dates in one place.
                </p>
              </li>
              <li className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
                  2
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Manage Production</h3>
                <p className="mt-2 text-base text-gray-600">
                  Plan your production schedule, track ingredients, and manage team tasks efficiently.
                </p>
              </li>
              <li className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
                  3
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Get Paid Faster</h3>
                <p className="mt-2 text-base text-gray-600">
                  Send professional invoices and enable online payments to improve your cash flow.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Loved by Bakers Everywhere
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              See why bakery owners choose BakeDiary to grow their business
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  SW
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Sarah Williams</h4>
                  <p className="text-sm text-gray-600">Custom Cake Creator</p>
                </div>
              </div>
              <p className="mt-4 text-gray-600">
                "BakeDiary has transformed how I manage my custom cake business. I can track orders, 
                schedule production, and handle payments all in one place. It's saved me hours of admin work!"
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