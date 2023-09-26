import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import multer from 'multer';
import { dirname, join } from 'path';
import z from 'zod';

import { SECRET_KEY, auth } from './auth';
import { Livro, RentHistory } from './types';

const _dirname = dirname('./Backend');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(_dirname, './upload/'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });
const port = 3000;
const app = express();
const prisma = new PrismaClient();
app.use('./upload', express.static('upload'));
app.use(cors());
app.use(express.json());

//logar usuario
app.post('/', async (req, res) => {
  const { email, password }: { email: string; password: string } = req.body;

  const validacao = z.object({
    email: z.string().email().min(1),
    password: z.string().min(1),
  });
  const usuarioValidado = validacao.parse({
    email: email,
    password: password,
  });

  const user = await prisma.user.findUnique({
    where: { email: usuarioValidado.email, password: usuarioValidado.password },
  });

  if (!user) {
    return res.status(404).json({ error: 'Usuário ou senha inválidos' });
  }

  const token = jwt.sign({ id: user.email.toString() }, SECRET_KEY, {
    expiresIn: '1h',
  });

  return res.json({ auth: true, token: token });
});

//validar usuario/token
// app.post('/auth', auth, async (req, res) => {
//   const { token }: { token: string } = req.body;
//   const email = jwt.decode(token);

//   const user = await prisma.user.findUnique({
//     where: { email: email as string },
//   });

//   if (!user) {
//     return res.status(401).send({ error: 'Usuário não encontrado' });
//   } else {
//     return res.status(201).send({ auth: true });
//   }
// });

//trazer imagem
app.get('/upload/:filename', (req, res) => {
  return res.sendFile(`./upload/${req.params.filename}`, {
    root: _dirname,
  });
});

//listar todos os livros
app.get('/books', auth, async (req, res) => {
  const books = await prisma.book.findMany({
    orderBy: {
      title: 'asc',
    },
  });
  return res.json(books);
});

//listar todos os generos
app.get('/books/generos', auth, async (req, res) => {
  const data = await prisma.book.findMany();
  const generos: string[] = Array.from(new Set(data.map(book => book.genre))).sort((a, b) => a.localeCompare(b));
  return res.json(generos);
});

//listar um livro
app.get('/books/:id', auth, async (req, res) => {
  const { id } = req.params;
  const livro = await prisma.book.findUnique({
    where: { id: id },
  });

  if (!livro) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }
  return res.json(livro);
});

//cadastrar novo livro
app.post('/books', upload.single('image'), auth, async (req, res) => {
  const img = req.file;
  const { title, author, genre, systemEntryDate, synopsis }: Livro = JSON.parse(req.body.newInfo);
  const dataSeparada = systemEntryDate
    .toString()
    .split('-')
    .map(item => Number(item));

  const validacao = z.object({
    title: z.string().min(1),
    author: z.string().min(1),
    genre: z.string().min(1),
    image: z.string().min(1),
    systemEntryDate: z.string().min(1),
    synopsis: z.string().min(1),
  });
  const livroValidado = validacao.parse({
    title: title,
    author: author,
    genre: genre,
    image: img ? img.filename : '',
    systemEntryDate: systemEntryDate,
    synopsis: synopsis,
  });

  await prisma.book.create({
    data: {
      title: livroValidado.title,
      author: livroValidado.author,
      genre: livroValidado.genre,
      image: livroValidado.image,
      systemEntryDate: new Date(dataSeparada[0], dataSeparada[1] - 1, dataSeparada[2]),
      synopsis: livroValidado.synopsis,
    },
  });

  return res.status(201).json(livroValidado);
});

//editar livro
app.patch('/books/:id', upload.single('image'), auth, async (req, res, next) => {
  const { id } = req.params;
  const img = req.file;
  const { title, author, genre, image, systemEntryDate, synopsis }: Livro = JSON.parse(req.body.newInfo);
  const dataSeparada = systemEntryDate
    .toString()
    .split('-')
    .map(item => Number(item));

  const livro = prisma.book.findUnique({
    where: {
      id: id,
    },
  });

  if (!livro) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  try {
    const validacao = z.object({
      title: z.string().min(1),
      author: z.string().min(1),
      genre: z.string().min(1),
      image: z.string().min(1),
      systemEntryDate: z.date(),
      synopsis: z.string().min(1),
    });

    const livroValidado = validacao.parse({
      title: title,
      author: author,
      genre: genre,
      image: img ? img.filename : image,
      systemEntryDate: new Date(dataSeparada[0], dataSeparada[1] - 1, dataSeparada[2]),
      synopsis: synopsis,
    });

    await prisma.book.update({
      where: {
        id: id,
      },
      data: livroValidado,
    });

    return res.status(201).json(livroValidado);
  } catch (e: any) {
    console.log(e);
    return e;
  }
});

//listar todos os historicos
app.get('/rentHistories', auth, async (req, res) => {
  const rentHistories = await prisma.rentHistory.findMany({
    include: {
      book: { select: { title: true } },
    },
  });

  if (!rentHistories) {
    return res.status(404).json({ error: 'Nenhum histórico encontrado' });
  }

  const formattedRentHistories = rentHistories.map(rentHistory => {
    return {
      title: rentHistory.book.title,
      studentName: rentHistory.studentName,
      class: rentHistory.class,
      withdrawalDate: moment(new Date(rentHistory.withdrawalDate)).format('DD/MM/YYYY'),
      deliveryDate: moment(new Date(rentHistory.deliveryDate)).format('DD/MM/YYYY'),
    };
  });

  return res.json(formattedRentHistories);
});

//listar historico de um livro
app.get('/renthistory/:id', auth, async (req, res) => {
  const { id } = req.params;
  const data = await prisma.rentHistory.findMany({
    where: {
      bookId: id,
    },
  });

  if (!data) {
    return res.status(404).json({ error: 'Nenhum histórico encontrado' });
  }

  const formattedRentHistories = data.map(history => {
    return {
      studentName: history.studentName,
      class: history.class,
      withdrawalDate: moment(new Date(history.withdrawalDate)).format('DD/MM/YYYY'),
      deliveryDate: moment(new Date(history.deliveryDate)).format('DD/MM/YYYY'),
    };
  });

  return res.json(formattedRentHistories);
});

//emprestar livro
app.patch('/biblioteca/emprestar/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  const novoEmprestimo: RentHistory = req.body;
  const livro = await prisma.book.findUnique({ where: { id: id } });

  const dataSeparadaRetirada = novoEmprestimo.withdrawalDate
    .toString()
    .split('-')
    .map(item => Number(item));

  const dataSeparadaDevolucao = novoEmprestimo.withdrawalDate
    .toString()
    .split('-')
    .map(item => Number(item));

  if (!livro) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }
  if (livro.isRented) {
    return res.status(400).json({ error: 'Livro já emprestado' });
  }
  if (livro.isActive === false) {
    return res.status(400).json({ error: 'Livro inativo' });
  }

  const validacao = z.object({
    studentName: z.string().min(1),
    class: z.string().min(1),
    withdrawalDate: z.date(),
    deliveryDate: z.date(),
  });

  const historicoValidado = validacao.parse({
    studentName: novoEmprestimo.studentName,
    class: novoEmprestimo.class,
    withdrawalDate: new Date(dataSeparadaRetirada[0], dataSeparadaRetirada[1] - 1, dataSeparadaRetirada[2]),
    deliveryDate: new Date(dataSeparadaDevolucao[0], dataSeparadaDevolucao[1] - 1, dataSeparadaDevolucao[2]),
  });

  await prisma.book.update({
    where: { id: id },
    data: {
      isRented: true,
      RentHistory: {
        create: {
          studentName: historicoValidado.studentName,
          class: historicoValidado.class,
          withdrawalDate: historicoValidado.withdrawalDate,
          deliveryDate: historicoValidado.deliveryDate,
        },
      },
    },
  });

  return res.status(201).json(historicoValidado);
});

//devolver livro
app.patch('/biblioteca/devolver/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  const livro = await prisma.book.findUnique({ where: { id: id } });

  if (!livro) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }
  if (livro.isRented === false) {
    return res.status(400).json({ error: 'Livro não está emprestado' });
  }

  const livroAtualizado = await prisma.book.update({
    where: { id: id },
    data: {
      isRented: false,
    },
  });

  return res.json(livroAtualizado);
});

//desativar livro
app.patch('/biblioteca/desativar/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  const { description } = req.body;
  const livro = await prisma.book.findUnique({ where: { id: id } });

  if (!description) {
    return res.status(400).json({ error: 'É necessário dar um motivo para a desativação' });
  }
  if (!livro) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  const validacao = z.object({
    description: z.string().min(10),
  });
  const descricaoValidada = validacao.parse({
    description: description,
  });

  await prisma.book.update({
    where: {
      id: id,
    },
    data: {
      statusDescription: descricaoValidada.description,
      isActive: false,
    },
  });

  return res.status(201);
});

//ativar livro
app.patch('/biblioteca/ativar/:id', auth, async (req, res, next) => {
  const { id } = req.params;
  const livro = await prisma.book.findUnique({ where: { id: id } });

  if (!livro) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }
  if (livro.isActive) {
    return res.status(400).json({ error: 'Livro já está ativado' });
  }

  await prisma.book.update({
    where: {
      id: id,
    },
    data: {
      statusDescription: 'ativo',
      isActive: true,
    },
  });

  const livroRetorno = await prisma.book.findUnique({ where: { id: id } });

  return res.status(201).json(livroRetorno);
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  res.status(500);
  res.send({ message: err.message });
});

app.listen(port, async () => {
  console.log(`Servidor executado no port ${port}`);
});
