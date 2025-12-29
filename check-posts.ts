import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBlogPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        published: true,
        publishedAt: true,
      },
    });

    console.log(`\n📊 Total de posts publicados: ${posts.length}\n`);
    
    if (posts.length > 0) {
      console.log('Posts encontrados:');
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   Slug: ${post.slug}`);
        console.log(`   Publicado: ${post.published ? 'Sim' : 'Não'}`);
        console.log(`   Data: ${post.publishedAt}\n`);
      });
    } else {
      console.log('⚠️  Nenhum post publicado encontrado no banco de dados!');
      console.log('Execute o seed script para criar posts de exemplo.');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlogPosts();
