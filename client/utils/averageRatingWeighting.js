export function averageRatingWeighting(waters) {
  if (waters) {
    let swapped;
    do {
      swapped = false;
      for (let i = 0; i < waters.length - 1; i++) {
        console.log(waters[i].ratings.length);
        if (
          waters[i].averageRating === waters[i + 1].averageRating &&
          waters[i + 1].ratings.length > waters[i].ratings.length
        ) {
          let temp = waters[i];
          waters[i] = waters[i + 1];
          waters[i + 1] = temp;
          swapped = true;
        }
      }
    } while (swapped);
  }
}
