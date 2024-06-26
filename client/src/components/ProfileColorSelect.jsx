export default function ProfileColorSelect() {
  return (
    <>
      {!userId ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5 mr-5"
          onClick={toggleColorMenu}
        >
          <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" />
        </svg>
      ) : (
        <></>
      )}

      <h1 className="mt-2">{username}</h1>

      {colorSelect ? (
        <div>
          <h3 className="flex justify-center mt-5 mb-2">
            Choose a Profile Color
          </h3>

          <div className=" mb-14 justify-center flex flex-wrap gap-4 md:gap-6 lg:gap-10">
            <div
              className={`user-red w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-red")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Red
                </h3>
              </div>
            </div>
            <div
              className={`user-pink w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-pink")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Pink
                </h3>
              </div>
            </div>
            <div
              className={`user-rose w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-rose")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Rose
                </h3>
              </div>
            </div>
            <div
              className={`user-amber w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-amber")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Amber
                </h3>
              </div>
            </div>
            <div
              className={`user-orange w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-orange")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Orange
                </h3>
              </div>
            </div>
            <div
              className={`user-yellow w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-yellow")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Yellow
                </h3>
              </div>
            </div>
            <div
              className={`user-lime w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-lime")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Lime
                </h3>
              </div>
            </div>
            <div
              className={`user-emerald w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-emerald")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Emerald
                </h3>
              </div>
            </div>
            <div
              className={`user-green w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-green")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Green
                </h3>
              </div>
            </div>
            <div
              className={`user-teal w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-teal")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Teal
                </h3>
              </div>
            </div>
            <div
              className={`user-cyan w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-cyan")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Cyan
                </h3>
              </div>
            </div>
            <div
              className={`user-sky w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-sky")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Sky
                </h3>
              </div>
            </div>
            <div
              className={`user-indigo w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-indigo")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Indigo
                </h3>
              </div>
            </div>
            <div
              className={`user-fuchsia w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-fuchsia")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Fuchsia
                </h3>
              </div>
            </div>

            <div
              className={`user-purple w-28 md:w-36 lg:w-48 h-20 md:h-24 lg:h-32 rounded-md text-center hover:bg-blue-300 hover:text-black`}
              onClick={(e) => handleEditUserColor(e, "user-purple")}
            >
              <div className="flex items-center justify-center h-full p-2 md:p-3 lg:p-4">
                <h3 className="text-sm md:text-base lg:text-lg font-medium">
                  Purple
                </h3>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
