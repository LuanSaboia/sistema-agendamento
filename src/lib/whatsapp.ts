// src/utils/whatsapp.ts

export const enviarZap = (telefone: string, nome: string, data: string, hora: string, tipo: 'confirmar' | 'remarcar') => {
    const ddi = "55";
    const numLimpo = telefone.replace(/\D/g, '');
    const foneFinal = numLimpo.startsWith('55') ? numLimpo : ddi + numLimpo;

    const mensagens = {
        confirmar: `${nome}, estou confirmando nosso acompanhamento para o dia ${data} no horário ${hora} lá no Shalom.`,
        remarcar: `${nome}, houve um imprevisto e queria saber se podemos remarcar o acompanhamento para o dia ${data} às ${hora}?`
    };

    const url = `https://api.whatsapp.com/send?phone=${foneFinal}&text=${encodeURIComponent(mensagens[tipo])}`;
    window.open(url, '_blank');
};