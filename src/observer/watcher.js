
import {pushTarget, popTarget} from './dep'
import {nextTick} from '../next-tick'
let uid = 0
export class Watcher{
    constructor(vm, expOrFn, cb){
        this.cb = cb;
        this.vm = vm;
        this.getter = expOrFn
        this.deps = []
        this.newDeps = []
        this.depIds = new Set()
        this.newDepIds = new Set()
        this.value = this.get()
        this.id = ++uid
    }
    update(){
        queueWatcher(this)
    }
    run(){
        const value = this.get()
        if (value !== this.value) {
            const oldValue = this.value
            this.value = value;
            this.cb.call(this.vm, value, oldValue);
        }
    }
    get(){
        pushTarget(this)
        const vm = this.vm
        const value = this.getter.call(vm, vm)
        popTarget()
        this.cleanupDeps()
        return value;
    }
    addDep (dep) {
        const id = dep.id
        if (!this.newDepIds.has(id)) {
            this.newDepIds.add(id)
            this.newDeps.push(dep)
            if (!this.depIds.has(id)) {
                dep.addSub(this)
            }
        }
    }
    cleanupDeps () {
        let i = this.deps.length
        while (i--) {
          const dep = this.deps[i]
          if (!this.newDepIds.has(dep.id)) {
            dep.removeSub(this)
          }
        }
        let tmp = this.depIds
        this.depIds = this.newDepIds
        this.newDepIds = tmp
        this.newDepIds.clear()
        tmp = this.deps
        this.deps = this.newDeps
        this.newDeps = tmp
        this.newDeps.length = 0
    }
}

const queue = []
let has = {}
let waiting = false
let flushing = false
let index = 0

function queueWatcher(watcher){
    const id = watcher.id
    if (has[id] == null) {
        has[id] = true
        if (!flushing) {
            queue.push(watcher)
          } else {
            let i = queue.length - 1
            while (i > index && queue[i].id > watcher.id) {
              i--
            }
            queue.splice(i + 1, 0, watcher)
          }
    }
    if (!waiting) {
        waiting = true
        nextTick(flushSchedulerQueue)
    }
}

function flushSchedulerQueue(){
    flushing = true
    queue.sort((a, b) => a.id - b.id)
    for (index = 0; index < queue.length; index++) {
        const watcher = queue[index]
        const id = watcher.id
        has[id] = null
        watcher.run()
    }
    resetSchedulerState()
}

function resetSchedulerState () {
    index = queue.length = 0
    has = {}
    waiting = flushing = false
  }