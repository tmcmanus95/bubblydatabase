import BubblyWaterListItem from "./BubblyWaterListItem";
export default function BubblyWaterList({ bubblyWaters }) {
  console.log("bubblyWaters", bubblyWaters);

  return (
    <section>
      <h1>Bubbly Page</h1>
      {bubblyWaters.map((bubblyWater) => (
        <BubblyWaterListItem key={bubblyWater._id} bubblyWater={bubblyWater} />
      ))}
    </section>
  );
}
