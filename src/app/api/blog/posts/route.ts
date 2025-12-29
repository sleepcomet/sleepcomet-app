import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CORS headers helper
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_WEBSITE_URL || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const published = searchParams.get("published") !== "false";

    const where = {
      published,
      ...(category && { category }),
    };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      publishedAt: post.publishedAt,
      readingTime: post.readingTime,
      author: post.author
        ? {
            id: post.author.id,
            name: post.author.name,
            avatar: post.author.image,
          }
        : undefined,
      tags: post.tags.map((t) => t.tag.name),
      featured: post.featured,
    }));

    const response = NextResponse.json({
      posts: formattedPosts,
      total,
      page,
      limit,
    });

    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
    return setCorsHeaders(errorResponse);
  }
}
