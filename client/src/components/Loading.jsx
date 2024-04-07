import { trio } from "ldrs";

export default function Loading() {
  trio.register();
  return (
    <div className="flex justify-center items-center m-20">
      <l-trio
        className="flex justify-center items-center text-blue-200"
        size="40"
        speed="1.75"
        color="lightskyblue"
      ></l-trio>
    </div>
  );
}
