import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Auth from "../../utils/auth";
import { Link } from "react-router-dom";
const navigation = [
  { name: "Home", href: "/", current: true },
  { name: "Profile", href: "/me", current: false },
  { name: "Login", href: "/login", current: false },
  { name: "Sign Up", href: "/signup", current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };
  return (
    <Disclosure as="nav" className="bg-blue-200">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center "></div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                    alt="Your Company"
                  />
                </div>
                <div className=" sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.current
                            ? "bg-red-300 text-white hover:text-black"
                            : " bg-red-300 text-white hover:text-black",
                          "rounded-md px-3 py-2 text-sm font-medium"
                        )}
                        aria-current={item.current ? "page" : undefined}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {Auth.loggedIn() ? (
            <>
              <Link to="/me">
                <button class="btn">View My Profile</button>
              </Link>
              <button onClick={logout} class="btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn">Login</button>
              </Link>
              <Link to="/signup">
                <button className="btn">Signup</button>
              </Link>
            </>
          )}
        </>
      )}
    </Disclosure>
  );
}
