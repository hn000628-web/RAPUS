import type { NextConfig } from "next";

const nextConfig: NextConfig = {

async rewrites(){

return [

{
source:"/api/regions/:path*",
destination:"http://localhost:4000/regions/:path*"
},

{
source:"/api/profile/:path*",
destination:"http://localhost:4000/profiles/:path*"
},

{
source:"/api/feed/:path*",
destination:"http://localhost:4000/feed/:path*"
},

{
source:"/api/auth/:path*",
destination:"http://localhost:4000/auth/:path*"
}

];

}

};

export default nextConfig;