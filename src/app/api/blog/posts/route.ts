import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({
      posts: formattedPosts,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}
