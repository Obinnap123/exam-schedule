"use client";
import React, { useEffect, useState } from "react";

interface TopbarProps {
  title: string;
}

interface User {
  firstName: string;
  lastName: string;
}

function Topbar({ title }: TopbarProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="h-16 bg-white shadow-md px-4 md:px-6 flex items-center justify-between mt-[30px] rounded-[5px]">
      <h3 className="text-xl font-semibold text-black">{title}</h3>
      <div className="flex items-center space-x-4">
        <span className="text-black">
          Hello, {user ? capitalizeFirstLetter(user.firstName) : 'Admin'}
        </span>
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
          {user ? getInitials(user.firstName, user.lastName) : 'A'}
        </div>
      </div>
    </div>
  );
}

export default Topbar;
