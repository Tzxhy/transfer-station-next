
type Task = () => Promise<any>
export async function runTask(tasks: Task[]): Promise<[number, number]> {

    if (!tasks.length) return Promise.resolve([0, 0]);

    return new Promise<[number, number]>(res => {
        let currentTaskIdx = 0;
        let currentTask: Task = tasks[currentTaskIdx]
        let successCount = 0;
        let failCount = 0;

        const ret = () => {
            res([successCount, failCount]);
        }

        const run: any = async () => {
            ++successCount;
            if (currentTaskIdx === tasks.length - 1) {
                return ret();
            }
            
            currentTask = tasks[++currentTaskIdx]
            return currentTask().then(run).catch(fail)
        }

        const fail: any = async () => {
            ++failCount;
            if (currentTaskIdx === tasks.length - 1) {
                return ret();
            }
            
            currentTask = tasks[++currentTaskIdx]
            return currentTask().then(run).catch(fail)
        }

        currentTask().then(run).catch(fail)
    })
}

// runTask([
//     () => new Promise(res => {
//         console.log(1)
//         setTimeout(res, 300);
//     }),
//     () => new Promise(res => {
//         console.log(2)
//         setTimeout(res, 300);
//     }),
//     () => new Promise((res, rej) => {
//         console.log(3)
//         setTimeout(rej, 300);
//     }),
//     () => new Promise(res => {
//         console.log(4)
//         setTimeout(res, 300);
//     }),
//     () => new Promise((res, rej) => {
//         console.log(5)
//         setTimeout(rej, 300);
//     }),

// ])