import { Link } from "react-router-dom";
export default function AllBrands() {
  return (
    <section className="m-5 mt-20">
      <div>
        <h3 className="text-4xl py-1 flex justify-center">All Brands</h3>
      </div>
      <div className="lg:flex gap-10 flex-wrap justify-center">
        <Link to="/brands/aha">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://www.coca-colacompany.com/content/dam/company/us/en/articles/aha-1.jpeg"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Aha</h3>
          </div>
        </Link>
        <Link to="/brands/bubly">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Bubly_logo_2018.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">bubly</h3>
          </div>
        </Link>
        <Link to="/brands/good-&-gather">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://images.squarespace-cdn.com/content/v1/5ef4b9a14215590dac8d9e26/f23f9c78-7993-47a1-9eaf-5c2aac767587/Untitled-2-01.jpg"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Good & Gather</h3>
          </div>
        </Link>
        <Link to="/brands/ice-mountain">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://photos.prnewswire.com/prnfull/20110601/NE11725LOGO"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Ice Mountain</h3>
          </div>
        </Link>

        <Link to="/brands/icelandic-glacial">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://images.squarespace-cdn.com/content/v1/570c0ddb22482e2a4ab0f2d8/1544147928643-LBME68USKJM5RUQN4Z9J/header_3a.jpg"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Icelandic Glacial</h3>
          </div>
        </Link>
        <Link to="/brands/kimino">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://m.media-amazon.com/images/I/61QAISgfH9L.jpg"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Kimino</h3>
          </div>
        </Link>
        <Link to="/brands/la-croix">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10 bg-white">
            <img
              src="https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/La_croix_%28logo%29.svg/800px-La_croix_%28logo%29.svg.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">La Croix</h3>
            <p className="py-2"></p>
          </div>
        </Link>
        <Link to="/brands/liquid-death">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/e/e3/Liquid-Death-Logo.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Liquid Death</h3>
          </div>
        </Link>
        <Link to="/brands/origin">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCVbTXVHxUvx7xrE-dD4_fxunxVuO-U95fYuwysOugMQ&s"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Origin</h3>
          </div>
        </Link>
        <Link to="/brands/perrier">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://1000logos.net/wp-content/uploads/2020/07/Perrier-Logo.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Perrier</h3>
          </div>
        </Link>
        <Link to="/brands/polar-seltzer">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Polar_Logo_2012.png/1200px-Polar_Logo_2012.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Polar Seltzer</h3>
          </div>
        </Link>
        <Link to="/brands/recess">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://m.media-amazon.com/images/S/stores-image-uploads-na-prod/f/AmazonStores/ATVPDKIKX0DER/ee9aa8e178b8abfef64270b13637863d.w1920.h1080.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Recess</h3>
          </div>
        </Link>
        <Link to="/brands/san-pellegrino">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://1000logos.net/wp-content/uploads/2020/09/S.-Pellegrino-Logo.jpg"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">San Pellegrino</h3>
          </div>
        </Link>
        <Link to="/brands/sanzo">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://pbs.twimg.com/media/FmN8T28WIBkEt4o.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Sanzo</h3>
          </div>
        </Link>
        <Link to="/brands/splash-fizz">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://drinksplash.com/cdn/shop/files/splash-blast-fizz-logo-lockup_54e9897f-f98a-49d1-bffe-86b5c8921e9d_512x360.jpg?v=1681161380"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Splash Fizz</h3>
          </div>
        </Link>

        <Link to="/brands/sparkling-ice">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/6/6c/SI_Logo_Purple_Soild_Bubbles.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Sparkling Ice</h3>
          </div>
        </Link>
        <Link to="/brands/spindrift">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://www.soulfirefarm.org/wp-content/uploads/2023/04/spindrift-logo-vector.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Spindrift</h3>
          </div>
        </Link>
        <Link to="/brands/topo-chico">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://www.topochico.com/content/dam/nagbrands/us/topochico/en/topo-chico-logo-2023.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Topo Chico</h3>
          </div>
        </Link>
        <Link to="/brands/untitled-art">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://www.drinkuntitled.com/wp-content/uploads/2023/02/logo_full_short.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Untitled Art</h3>
          </div>
        </Link>
        <Link to="/brands/waterloo">
          <div className="flex-1 text-center shadow-lg p-10 rounded-xl my-10  bg-white">
            <img
              src="https://www.drinkwaterloo.com/wp-content/uploads/2023/05/brand-logo.png"
              width={100}
              height={100}
              className="mx-auto"
            />
            <h3 className="text-lg font-medium pt-8 pb-2">Waterloo</h3>
          </div>
        </Link>
      </div>
    </section>
  );
}
