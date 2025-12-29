import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

    return NextResponse.json(formattedPost);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}
