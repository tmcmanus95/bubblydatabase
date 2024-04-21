import BasicRating from "./FiveStarRating";
import { Link } from "react-router-dom";
import { useState } from "react";
import Rating from "@mui/material/Rating";
import { PiFeatherBold } from "react-icons/pi";
import { BiSolidCoffeeBean } from "react-icons/bi";
import { styled } from "@mui/material/styles";
import { materialUIStylings } from "../../utils/materialUIStylings";
import StarIcon from "@mui/icons-material/Star";
import { capitalizeFlavors } from "../../utils/capitalizeFlavors";
import { capitalizeSingleFlavor } from "../../utils/capitalizeSingleFlavor";
import { formatBrands } from "../../utils/formatBrands";
import CustomColorRating from "./CustomColorRating";

export default function BubblyWaterListItem({ bubblyWater, ranking }) {
  let ratingCount = 0;
  let hasCBD = false;
  let hasCaffeine = false;
  ranking = ranking + 1;
  const capitalizedFlavors = capitalizeFlavors(bubblyWater);
  if (bubblyWater.ratings.length) {
    ratingCount = bubblyWater?.ratings?.length;
  }
  if (bubblyWater.hasCBD == true) {
    hasCBD = true;
  }
  if (bubblyWater.isCaffeinated == true) {
    hasCaffeine = true;
  }

  return (
    <div className="justify-center">
      <section className="m-2 md:m-5 flex justify-center">
        <div className="lg:flex lg:items-start lg:flex-row gap-5">
          <div className=" lg:p-5 rounded-xl my-5 font-bold bg-white lg:flex lg:flex-row lg:items-center flex-col items-center text-center lg:w-auto w-10 justify-center mr-3">
            #{ranking}
          </div>

          <div className="bg-white  p-5 rounded-xl my-5 text-center justify-center lg:flex lg:items-start lg:flex-grow">
            <Link
              to={`/bubblyWater/${bubblyWater._id}`}
              className="flex justify-center lg:mr-5"
            >
              <img
                src={bubblyWater.imageURL}
                className="mx-auto lg:mx-0 lg:mb-0 object-cover w-40 h-52"
              />
            </Link>
            <div className="flex flex-col justify-center mx-auto lg:w-3/5">
              <div className=" flex items-right md:mt-0 mt-3">
                {hasCBD && (
                  <>
                    <PiFeatherBold />
                    <h5 className="ml-1">CBD</h5>
                  </>
                )}
                {hasCaffeine && (
                  <>
                    <BiSolidCoffeeBean />
                    <h5 className="ml-1 text-xs">Caffeine</h5>
                  </>
                )}
              </div>

              <Link to={`/brands/${bubblyWater.brandName}`}>
                <h3 className="text-lg font-medium pt-2 lg:pt-8 ">
                  {formatBrands(bubblyWater.brandName)}
                </h3>
              </Link>
              <p className="mb-2 lg:mb-5">{bubblyWater.productName}</p>
              <h5 className="flex items-center text-center justify-center">
                <span className="font-bold mr-2">Flavors</span>
                <div className="flex flex-wrap max-w-[14rem] justify-center gap-y-3">
                  {capitalizedFlavors.map((flavor, index) => (
                    <Link to={`/flavors/${flavor.toLowerCase()}`} key={index}>
                      <span
                        className={`${flavor} whitespace-nowrap text-center`}
                      >
                        {flavor.replace(/-/g, " ")}
                      </span>
                    </Link>
                  ))}
                </div>
              </h5>
              <h5 className="mb-2 py-2 text-center">
                Average rating: {bubblyWater.averageRating.toFixed(2)} / 5.0
              </h5>
              <Link to={`/bubblyWater/${bubblyWater._id}`}>
                {/* <Rating
                  readOnly
                  value={bubblyWater.averageRating}
                  precision={0.1}
                /> */}
                <CustomColorRating
                  flavor={capitalizedFlavors[0]}
                  rating={bubblyWater.averageRating}
                />

                <span>({ratingCount})</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
