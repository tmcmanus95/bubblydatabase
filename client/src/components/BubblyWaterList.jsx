import BubblyWaterListItem from "./BubblyWaterListItem";

export default function BubblyWaterList({ data }) {
  return (
    <div>
      {data ? (
        <>
          {data?.flavors.map((bubblyWater, index) => (
            <BubblyWaterListItem key={index} bubblyWater={bubblyWater} />
          ))}
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
