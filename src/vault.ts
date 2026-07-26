import "node-ipc"
import { password  } from '@inquirer/prompts';

export async function CreateNewServer() {
    const response = await password ({ 
        message: 'Create a Master Password',
        mask: true
    })
    console.log(response);

}