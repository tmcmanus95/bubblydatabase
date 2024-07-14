import { useState } from "react";
import { useParams } from "react-router-dom";
export default function AllRatings() {
  const { userId, numRange } = useParams();
  console.log(`userId: ${userId} | numRange ${numRange}`);
}
