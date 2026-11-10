/**
 * motivationalQuotes.js
 * Frases do card "pensamento do dia" da home. A frase muda uma vez por dia,
 * pelo dia do ano. Movido de HomeDashboard (D17) sem mudar o texto.
 */
export const MOTIVATIONAL_QUOTES = [
    "Faça ou não faça. Tentativa não há. — Mestre Yoda",
    "Ninguém vai bater tão duro quanto a vida. Se trata de quanto você aguenta apanhar e seguir em frente. — Rocky Balboa",
    "A verdadeira força de um guerreiro não está no tamanho de seus músculos, mas na sua vontade de dar mais um passo. — Mestre dos Magos",
    "A resistência que você enfrenta na academia constrói a força que você precisa para vencer na vida. — Arnold Schwarzenegger",
    "Equilíbrio é a chave. Corpo são, mente sã. Respire e foque no movimento. — Sr. Miyagi",
    "Os limites só existem se você deixar. Eleve o seu ki e quebre todos eles hoje! — Goku",
    "Não reze por uma vida fácil, reze por força para suportar uma vida difícil. — Bruce Lee",
    "Tudo o que temos de decidir é o que fazer com o tempo que nos é dado. Faça o seu treino valer a pena. — Gandalf",
    "Cansado? Lembre-se do seu objetivo e diga a si mesmo: 'Eu posso fazer isso o dia todo'. — Capitão América",
    "Eu odiava cada minuto de treino, mas dizia: 'Não desista. Sofra agora e viva o resto da vida como um campeão'. — Muhammad Ali",
    "A dor é apenas o seu corpo dizendo que a fraqueza está indo embora. Vai lá e faz o trabalho. — Wolverine",
    "Lembre-se de quem você é. Você é muito mais forte do que imagina ser. — Mufasa",
    "Eu posso aceitar o fracasso, todo mundo falha em alguma coisa. Mas eu não posso aceitar não tentar. — Michael Jordan",
    "Por que nós caímos? Para aprendermos a nos levantar. Volte para a arena. — Batman",
    "Você é mais forte do que acredita. Tem mais poder do que jamais imaginou. — Mulher-Maravilha",
    "O trabalho duro é inútil para aqueles que não acreditam em si mesmos. Esse é o meu jeito ninja! — Naruto",
    "São as nossas escolhas, mais do que as nossas capacidades, que mostram quem realmente somos. Escolha não desistir hoje. — Alvo Dumbledore",
    "O maior poder que você possui é a sua própria mente. Quando ela acredita, o corpo simplesmente obedece. — Professor Xavier",
    "O progresso é como uma xícara de chá quente: leva tempo e paciência, mas aquece a alma de quem persiste. — Tio Iroh",
    "Não lamente o cansaço. Seja melhor. — Kratos",
    "Não tente erguer o peso. Apenas perceba a verdade: a força vem da sua própria mente. — Neo",
    "Quando o treino ficar muito pesado, sabe o que você faz? Continue a treinar, continue a treinar... — Dory",
    "Quando a sua mente disser que você chegou ao limite, você está apenas em 40% da sua capacidade. Continue. — David Goggins",
    "Você pode usar os melhores equipamentos, mas o verdadeiro reator principal é a sua força de vontade. — Tony Stark",
    "A sorte não tem nada a ver com o sucesso. É o resultado de horas e horas de treino. A quadra agora é sua. — Serena Williams",
    "A pressa é a inimiga da perfeição. Foque na postura, respire fundo e execute o movimento com maestria. — Mestre Splinter",
    "Eu treinei por quatro anos para correr apenas nove segundos. Não desista se você não vir resultados em poucas semanas. — Usain Bolt",
    "O segredo da força absoluta... é que não existe ingrediente secreto. O ingrediente é só você! — Po",
    "Não se contente com o treino de ontem. Ultrapasse as suas metas de hoje. Ao infinito... e além! — Buzz Lightyear",
    "O sucesso não é um acidente. É trabalho duro, perseverança, aprendizado, sacrifício e amor pelo que você faz. — Pelé",
    "Em minha longa experiência, não existe isso de sorte. Existe apenas o resultado do seu treinamento. — Obi-Wan Kenobi",
    "O que fazemos pelo nosso corpo hoje, ecoa na nossa saúde pela eternidade. Força e honra. — Maximus",
    "Eu nunca olho para o treino de ontem, querido. Distrai do agora. Foco total na sua próxima série! — Edna Moda",
    "As coisas podem parecer pesadas agora, mas são nessas horas que a gente descobre a força real para continuar. — Samwise Gamgee",
    "O talento sem trabalho duro e repetição constante não é nada. Prove a sua dedicação hoje. — Cristiano Ronaldo",
    "O guerreiro mais formidável nunca para de aprimorar suas defesas e ataques. Mostre do que você é feito. — Pantera Negra",
    "Que a disposição esteja sempre a seu favor. Mas, na dúvida, não confie na sorte, confie no seu treino. — Katniss Everdeen",
    "Eu só posso lhe mostrar o caminho e a ficha de treino. É você quem tem que suar a camisa. — Morpheus",
    "Não importa o quão pesada seja a carga, nós não recuamos. Transforme-se e supere seus limites! — Optimus Prime",
    "A diferença entre o impossível e o possível é só uma questão de quanto suor você está disposto a deixar pelo caminho. — Lara Croft"
];

/** Frase do dia: índice pelo dia do ano, dando a volta na lista. */
export function getDailyQuote(today = new Date()) {
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}
