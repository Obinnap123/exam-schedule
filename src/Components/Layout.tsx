import Header from "./Header";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col w-[100%] max-w-[950px] mx-auto">
          <Topbar />
          <main className="p-6 bg-gray-100 min-h-screen my-[30px] rounded-[5px]">{children}</main>
        </div>
      </div>
    </>
  );
}

export default Layout;
