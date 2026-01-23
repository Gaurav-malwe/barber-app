import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Emit a fully static export for S3/CloudFront hosting.
	output: "export",
	// Disable built-in image optimization; export writes static files only.
	images: { unoptimized: true },
};

export default nextConfig;
