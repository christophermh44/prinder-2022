import * as Vue from './vue.js'

const App = {
    watch: {
        step() {
            window.scrollTo(0, 0)
        }
    },

    data() {return {
        step: 'start',
        questions: [],
        answers: [],
        candidates: [],
        dialog: null,
        default_answer: null,
        results: []
    }},
    
    methods: {
        async load() {
            try {
                const response = await (await fetch('prinder.json')).json()
                return Promise.resolve(response)
            } catch (e) {
                return Promise.reject(e)
            }
        },

        showDetails(question) {
            this.dialog = question
            this.$refs.dialog.showModal()
            this.$nextTick(() => {
                this.$refs.details.open = false
            })
        },

        shuffle(array) {
            let index = -1
            let length = array.length
            let lastIndex = length - 1
            while (++index < length) {
                let rand = index + Math.floor(Math.random() * (lastIndex - index + 1))
                let value = array[rand]
                array[rand] = array[index]
                array[index] = value
            }
        },

        go() {
            this.reset()
            this.step = 'questions'
        },

        reset() {
            this.questions.forEach(question => {
                question.answer = this.default_answer
            })
            this.shuffle(this.questions)
            this.candidates.forEach(candidate => {
                candidate.score = 0
            })
        },

        compute() {
            this.questions.forEach(question => {
                this.candidates.filter(candidate => question.candidates.includes(candidate.id)).forEach(candidate => {
                    candidate.score += question.answer
                })
            })
            this.candidates.forEach(candidate => {
                candidate.percentage = (candidate.score / candidate.ideasCount * 100) || 0
            })
            this.results = Object.assign([], this.candidates)
            this.shuffle(this.results)
            this.results = this.results.sort((a, b) => {
                return b.percentage - a.percentage
            })
            let previousPercentage = null
            let rank = 0
            let exaequos = {}
            this.results.forEach((result, index) => {
                if (result.percentage === previousPercentage) {
                    result.rank = `#${rank} ex-æquo`
                    this.results[index - 1].rank = result.rank
                } else {
                    result.rank = `#${++rank}`
                }
                previousPercentage = result.percentage
            })
            this.step = 'finish'
        }
    },
    
    async mounted() {
        try {
            const { candidates, answers, questions, default_answer } = await this.load()
            this.answers = answers
            this.default_answer = default_answer
            this.questions = questions.map(question => {
                question.answer = default_answer
                return question
            })
            this.candidates = candidates.map(candidate => {
                candidate.photo = `candidates/${candidate.id}.png`
                candidate.logo = `parties/${candidate.id}.svg`
                candidate.score = 0
                candidate.ideasCount = this.questions.filter(question => question.candidates.includes(candidate.id)).length
                return candidate
            })
        } catch (e) {
            console.error(e)
        }
    }
}

Vue
.createApp(App)
.mount('#vue-app')