import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Compression
  compress: true,

  // Note: swcMinify is enabled by default in Next.js 16, no need to specify

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@tanstack/react-table",
      "recharts",
      "date-fns",
    ],
  },

  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  // Set empty config to use Turbopack, or use webpack for legacy support
  turbopack: {},

  // Webpack optimizations (fallback for --webpack flag)
  webpack: (config, { isServer, dev }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for large libraries
          vendor: {
            name: "vendor",
            chunks: "all",
            test: /node_modules/,
            priority: 20,
          },
          // PDF.js in separate chunk (large library)
          pdfjs: {
            name: "pdfjs",
            test: /[\\/]node_modules[\\/](pdfjs-dist|pdf-lib)[\\/]/,
            chunks: "all",
            priority: 30,
          },
          // React Query in separate chunk
          reactQuery: {
            name: "react-query",
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            chunks: "all",
            priority: 25,
          },
          // Radix UI components
          radix: {
            name: "radix-ui",
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            chunks: "all",
            priority: 15,
          },
          // Common chunk for shared code
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // Headers for caching and performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
