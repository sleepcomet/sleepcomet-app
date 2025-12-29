import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CORS headers helper
function setCorsHeaders(response: NextResponse) {
  const websiteUrl = (process.env.NEXT_PUBLIC_WEBSITE_URL || '*').replace(/['"]/g, '');
  response.headers.set('Access-Control-Allow-Origin', websiteUrl);
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response);
}

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findUnique({
      where: {
        slug,
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!post) {
      const notFoundResponse = NextResponse.json({ error: "Post not found" }, { status: 404 });
      return setCorsHeaders(notFoundResponse);
    }

    const formattedPost = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      readingTime: post.readingTime,
      author: post.author
        ? {
            id: post.author.id,
            name: post.author.name,
            email: post.author.email,
            avatar: post.author.image,
          }
        : undefined,
      tags: post.tags.map((t) => t.tag.name),
      featured: post.featured,
      published: post.published,
    };

    const response = NextResponse.json(formattedPost);
    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    const errorResponse = NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
    return setCorsHeaders(errorResponse);
  }
}
