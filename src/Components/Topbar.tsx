import React from "react";

function Topbar() {
  return (
    <>
      <div>the name of a boy</div>

      <div className="h-16 bg-white shadow-md px-6 flex items-center justify-between mt-[30px] rounded-[5px]">
        <h3 className="text-xl font-semibold text-black">Dashboard</h3>
        <div className="flex items-center space-x-4">
          <span className="text-black">Hello, Admin</span>
          <div className="w-10 h-10 rounded-full bg-gray-300"></div>
        </div>
      </div>
    </>
  );
}

export default Topbar;
