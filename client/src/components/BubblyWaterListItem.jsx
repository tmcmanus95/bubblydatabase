export default function BubblyWaterListItem({ bubblyWater }) {
  return (
    <div>
      <h1>{bubblyWater.brandName}</h1>
      <h2>{bubblyWater.productName}</h2>
      <h5>{bubblyWater.flavor}</h5>
    </div>
  );
}
