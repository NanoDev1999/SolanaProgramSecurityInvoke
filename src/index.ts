import * as web3 from "@solana/web3.js";
import * as borsh from '@project-serum/borsh';
import dotenv from "dotenv";
dotenv.config();

const welcomeMsg = "Welcome to Solana! Activating a Program on the Solana Blockchain.";
console.log(`${welcomeMsg}!`);


// KEYPAIR_PRIVATE_KEY should be in the format of a [] with lots of numbers that were generated from your keypair using solana cli
const secret = JSON.parse(process.env.KEYPAIR_PRIVATE_KEY ?? "") as number[];
const secretKey = Uint8Array.from(secret);
const keypairFromSecretKey = web3.Keypair.fromSecretKey(secretKey);

const programId = new web3.PublicKey(process.env.PROGRAM_ID_FULL_MOVIE ?? "");
const connection = new web3.Connection(web3.clusterApiUrl("devnet"));



const movieInstructionLayout = borsh.struct([
    borsh.u8('variant'),
    borsh.str('title'),
    borsh.u8('rating'),
    borsh.str('description')
]); // this is going to match the rust contract



// Send Test Movie Review

// Set up Movie Data

let buffer = Buffer.alloc(1000);
const movieTitle = `Braveheart${Math.random()*1000000}`;
const movieDescription = "A  movie about a Scottish warrior who leads a rebellion against the cruel English tyrant in the 13th century.";
const movieRating = 5;

movieInstructionLayout.encode(
    {
        variant: 0,
        title: movieTitle,
        rating: movieRating,
        description: movieDescription
    },
    buffer
);

buffer = buffer.slice(0, movieInstructionLayout.getSpan(buffer));

const [pda] = await web3.PublicKey.findProgramAddressSync(
    [keypairFromSecretKey.publicKey.toBuffer(), Buffer.from(movieTitle)],
    programId
);

console.log("PDA is:", pda.toBase58());


// Set up Transaction Data 
const transaction = new web3.Transaction();

const instruction = new web3.TransactionInstruction({
    programId: programId,
    data: buffer,
    keys: [
        {
            pubkey: keypairFromSecretKey.publicKey,
            isSigner: true,
            isWritable: false
        },
        {
            pubkey: pda,
            isSigner: false,
            isWritable: true
        },
        {
            pubkey: web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false
        }
    ]
})

transaction.add(instruction);

console.log(`Executing transaction with public key: ${process.env.KEYPAIR_PUBLIC_KEY} on program id: ${programId}`);

const transactionSignature = await web3.sendAndConfirmTransaction(connection, transaction, [keypairFromSecretKey]);

console.log(`Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`);


