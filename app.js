const {Client,GatewayIntentBits,EmbedBuilder} =require('discord.js');
const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();
// import { nanoid } from 'nanoid'

const User = require('./models/userModel.js');
const Task = require('./models/taskModel.js');

const client = new Client({
    intents : [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
})

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('connected to db'))
.catch(()=>console.log('error connecting to server'))


client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const PREFIX = '!';

client.on('messageCreate',async (message) =>{
    if(message.author.bot) return;

    if( !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();  // removing first element of arr and store it to commands to match case afterwards

    try{
        switch(command){
            case 'register':
                //console.log(message);            // message -> will have required authorid,name,pfp, etc... of current user who initiated the message
                 await handleRegister(message)
                break;
            case 'add':
                await handleAddTask(message,args)
                break;
            case 'remove':
                await handleRemoveTask(message,args)
                break;
            case 'list':
                await handleListTasks(message)
                break;
            case 'help':
                await handleHelp(message)
                break;
        }
    }
    catch(e){
        console.log(e.message)
        message.reply('An error occurred while processing your command.');
    }
})

// register User
async function handleRegister(message){
    try{
        const existingUser = await User.findOne({userId : message.author.id})
        if(existingUser){
            return message.reply('You are already registered!');
        }
        const newUser = new User({
            userId : message.author.id,
            username : message.author.username,
        });
        await newUser.save();
        message.reply(`Welcome ${message.author.username}! You have been registered.  try !help to get started `)
    }   
    catch(e){
        console.log(e.message);
        message.reply('Failed to register. Please try again.');
    }
}

function generate4DigitID() {
    return Math.floor(1000 + Math.random() * 9000); // Ensures the number is always 4 digits
}

async function generateUniqueTaskID(){
    let taskId = '';
    let isUnique = false;

    while(isUnique != true){
        taskId = 't' + generate4DigitID();
        const existingTask = await Task.findOne({ taskId })

        if(!existingTask){
            isUnique = true;
        }
    }
    return taskId;
}

// Add New Task
async function handleAddTask(message,args){
    try{
        // console.log(args)  // as we shifted() args for commands so, it will modify orignal args so !add my task => args = ['my','task'] 
        if(args.length === 0){
            message.reply("Please provide a task description!  !add task-description")
        }

        const existingUser = await User.findOne({userId: message.author.id});
        if(!existingUser){
            message.reply("Please register first using !register")
        }

        const taskDescription = args.join(" ");   // as [] -> string
        const taskId = await generateUniqueTaskID();

        const newTask = new Task({
            taskId,
            userId: message.author.id,
            description: taskDescription,
            user: existingUser._id                  // reference to User document
        })

        await newTask.save();
        
        // Adding task reference to user's tasks array
        existingUser.tasks.push(newTask._id);
        await existingUser.save();

        message.reply(`Task added! ID: ${taskId} `);
    }   
    catch(e){
        console.log(e.message)
        message.reply('Failed to add task. Please try again.');
    }
}

// remove specific task
async function handleRemoveTask(message,args){
    try{

    if (args.length === 0) {
        return message.reply('Please provide a task ID! for example !remove t1234' );
    }

    const taskId = args[0];

    const user = await User.findOne({ userId: message.author.id });
    if (!user) {
      return message.reply('User not found! please register if not');
    }

    const foundTask = await Task.findOne({
        taskId ,
        userId : message.author.id 
    });

    if (!foundTask) {
        return message.reply(`Task "${taskId}" not found or you don't have permission to remove it.`);
    }

    // Removing task refrence by filtering , store all tasks except for the one whose taskId needs to be removed. to compare User->tasks arr->ref(Task ._id) with getted taskid of (const foundTask)->Task->._id
    user.tasks = user.tasks.filter((t)=>!t.equals(foundTask._id))
    await user.save();

    // remove that task document
    await Task.deleteOne({ _id: foundTask._id });

    message.reply(`Task ${taskId} removed successfully!`);

    }
    catch(e){
        console.log(e.message);
        message.reply('Failed to remove task. Please try again.');
    }
}

// list out all the tasks
async function handleListTasks(message){
    try{

        const user = await User.findOne({ userId: message.author.id })
        .populate('tasks');     // populating tasks field of user so can use tasks attributes and also to sort by createdAt 

        if(!user) return message.reply("You are not registered. type !register to get register");

        if(!user.tasks.length === 0){
            return message.reply("You don't have any tasks!");
        }

        const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('here is the list of all your tasks :')
        .setDescription(`Your tasks : total ${user.tasks.length}`)

        const sortedTasks = user.tasks
        .sort((a,b)=>b.createdAt - a.createdAt)             //[11,2,22,1].sort((a, b) => a - b) Sorts an array in place. This method mutates the array and returns a reference to the same array.

        sortedTasks.forEach((task,index) => {
            embed.addFields({
                name : `${index + 1}. Task ${task.taskId}`,
                value: `${task.description}\nCreated: ${task.createdAt.toLocaleDateString()}`,
                inline: false
            });
        });

        message.reply({ embeds: [embed] });
        
    }
    catch(e){
        console.log(e.message)
        message.reply('Failed to list the tasks. Please try again.');
    }
}

// list all available commands
async function handleHelp(message){

    const embed = new EmbedBuilder()
    .setTitle('Bot Commands')
    .setDescription('Here are all available commands: \n (Note: remove < > in commands)')
    .setColor('#0088ff')
    .addFields(
      { name: '!register', value: 'Register yourself to use the bot (one-time only)', inline: false },
      { name: '!add <task>', value: 'Add a new task to your list', inline: false },
      { name: '!remove <task_id>', value: 'Remove a task by its ID', inline: false },
      { name: '!list', value: 'Show all your tasks', inline: false },
      { name: '!help', value: 'Show this help message', inline: false },
    );

    message.reply({ embeds: [embed] });
}



client.login(process.env.DISCORD_TOKEN);

// console.log(nanoid(4));