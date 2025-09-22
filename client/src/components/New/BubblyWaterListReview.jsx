export default function BubblyWaterListReview({ bubblyWater }) {
  return (
    <div className="w-40">
      <h2 className="text-center">Top Review</h2>
      <div></div>
      <div className="flex-wrap">{bubblyWater.topReview.reviewText}</div>
    </div>
  );
}
