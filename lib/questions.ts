export type Question = {
    id: string;
    category: string;
    difficulty: "Easy" | "Medium" | "Hard";
    question: string;
    keyPoints: string[];
};

export const questionBank: Question[] = [
    // ─── JavaScript ───
    {
        id: "js1",
        category: "JavaScript",
        difficulty: "Medium",
        question: "Explain the concept of closures in JavaScript and provide a practical use case.",
        keyPoints: ["Inner function has access to outer function's variable scope", "Data privacy/encapsulation", "State retention between function calls"],
    },
    {
        id: "js2",
        category: "JavaScript",
        difficulty: "Medium",
        question: "What is the event loop in JavaScript and how does it handle asynchronous operations?",
        keyPoints: ["Single-threaded non-blocking I/O", "Call stack vs Web APIs vs Callback Queue", "Microtasks vs Macrotasks"],
    },
    {
        id: "js3",
        category: "JavaScript",
        difficulty: "Easy",
        question: "What are the differences between var, let, and const in JavaScript?",
        keyPoints: ["Block scoping vs function scoping", "Hoisting behavior", "Reassignment rules"],
    },
    {
        id: "js4",
        category: "JavaScript",
        difficulty: "Hard",
        question: "Explain prototypal inheritance in JavaScript. How does it differ from classical inheritance?",
        keyPoints: ["Prototype chain", "Object.create vs constructor functions", "ES6 class syntax is syntactic sugar"],
    },
    {
        id: "js5",
        category: "JavaScript",
        difficulty: "Medium",
        question: "What are Promises in JavaScript? How do they compare to async/await?",
        keyPoints: ["Promise states: pending, fulfilled, rejected", "Chaining with .then/.catch", "async/await is syntactic sugar over promises"],
    },
    {
        id: "js6",
        category: "JavaScript",
        difficulty: "Hard",
        question: "Explain the concept of 'this' keyword in JavaScript. How does its behavior change across different contexts?",
        keyPoints: ["Global context, function context, method context", "Arrow functions and lexical this", "bind, call, apply methods"],
    },
    {
        id: "js7",
        category: "JavaScript",
        difficulty: "Medium",
        question: "What is hoisting in JavaScript? How does it work with functions and variables?",
        keyPoints: ["Function declarations are fully hoisted", "var declarations are hoisted but not initialized", "let/const are in temporal dead zone"],
    },
    {
        id: "js8",
        category: "JavaScript",
        difficulty: "Medium",
        question: "Explain the difference between shallow copy and deep copy in JavaScript. How would you implement each?",
        keyPoints: ["Spread operator and Object.assign for shallow", "JSON.parse/stringify for simple deep copy", "structuredClone or recursive approach for complex deep copy"],
    },

    // ─── React ───
    {
        id: "react1",
        category: "React",
        difficulty: "Medium",
        question: "How does React's Virtual DOM work, and why is it faster than updating the real DOM?",
        keyPoints: ["In-memory representation of DOM", "Diffing algorithm (reconciliation)", "Batching DOM updates"],
    },
    {
        id: "react2",
        category: "React",
        difficulty: "Hard",
        question: "Explain the useEffect hook and how to properly manage dependencies and cleanup functions.",
        keyPoints: ["Side effects after render", "Dependency array rules", "Returning a cleanup function to prevent memory leaks"],
    },
    {
        id: "react3",
        category: "React",
        difficulty: "Medium",
        question: "What is the difference between controlled and uncontrolled components in React?",
        keyPoints: ["State management via props vs refs", "Controlled inputs update through onChange", "When to use each approach"],
    },
    {
        id: "react4",
        category: "React",
        difficulty: "Hard",
        question: "Explain React's reconciliation algorithm. How does the key prop affect rendering performance?",
        keyPoints: ["Diffing heuristics O(n)", "Importance of stable keys in lists", "Avoiding index as key in dynamic lists"],
    },
    {
        id: "react5",
        category: "React",
        difficulty: "Medium",
        question: "What are React hooks rules and why do they exist? Explain the useState and useReducer hooks.",
        keyPoints: ["Must be called at top level, not inside conditions", "useState for simple state", "useReducer for complex state logic"],
    },
    {
        id: "react6",
        category: "React",
        difficulty: "Hard",
        question: "Explain React Context API and its performance implications. When should you use it vs Redux or Zustand?",
        keyPoints: ["Provider/Consumer pattern", "Re-renders all consumers on value change", "Splitting contexts for optimization"],
    },
    {
        id: "react7",
        category: "React",
        difficulty: "Medium",
        question: "What is React Server Components? How do they differ from Client Components?",
        keyPoints: ["Rendered on the server, zero client bundle", "Cannot use hooks or browser APIs", "Use 'use client' directive for client components"],
    },

    // ─── Node.js ───
    {
        id: "node1",
        category: "Node.js",
        difficulty: "Medium",
        question: "Explain how Node.js streams work and why they are useful for handling large files.",
        keyPoints: ["Reading/writing data in chunks", "Lower memory footprint", "Types of streams (Readable, Writable, Duplex, Transform)"],
    },
    {
        id: "node2",
        category: "Node.js",
        difficulty: "Medium",
        question: "What is the Node.js cluster module and how does it help with scaling applications?",
        keyPoints: ["Forking multiple worker processes", "Sharing the same port", "Load balancing across CPU cores"],
    },
    {
        id: "node3",
        category: "Node.js",
        difficulty: "Hard",
        question: "Explain the difference between process.nextTick and setImmediate in Node.js. When would you use each?",
        keyPoints: ["nextTick fires before I/O events", "setImmediate fires after I/O events", "Event loop phases"],
    },
    {
        id: "node4",
        category: "Node.js",
        difficulty: "Easy",
        question: "What is middleware in Express.js? How does the middleware chain work?",
        keyPoints: ["Functions with access to req, res, next", "Order of middleware matters", "Error handling middleware"],
    },

    // ─── Python ───
    {
        id: "py1",
        category: "Python",
        difficulty: "Medium",
        question: "What are decorators in Python and how do you write a custom decorator?",
        keyPoints: ["Functions that take another function as argument", "Modifying behavior without changing code", "Use of @ syntax and wrapper functions"],
    },
    {
        id: "py2",
        category: "Python",
        difficulty: "Medium",
        question: "Explain Python generators and the yield keyword. What are their advantages over regular functions?",
        keyPoints: ["Lazy evaluation", "Memory efficiency for large datasets", "Iterator protocol implementation"],
    },
    {
        id: "py3",
        category: "Python",
        difficulty: "Hard",
        question: "What is the Global Interpreter Lock (GIL) in Python? How does it affect multi-threaded programs?",
        keyPoints: ["Only one thread executes Python bytecode at a time", "CPU-bound vs I/O-bound tasks", "Multiprocessing as alternative"],
    },
    {
        id: "py4",
        category: "Python",
        difficulty: "Easy",
        question: "What is the difference between a list and a tuple in Python? When would you use each?",
        keyPoints: ["Mutability vs immutability", "Tuples as dictionary keys", "Performance differences"],
    },

    // ─── Data Structures & Algorithms ───
    {
        id: "dsa1",
        category: "Data Structures & Algorithms",
        difficulty: "Easy",
        question: "What is the difference between an Array and a Linked List?",
        keyPoints: ["Contiguous memory vs nodes with pointers", "O(1) access vs O(N) access", "Cost of insertion/deletion"],
    },
    {
        id: "dsa2",
        category: "Data Structures & Algorithms",
        difficulty: "Medium",
        question: "Explain the concepts of Time and Space complexity using Big O notation.",
        keyPoints: ["Upper bound of algorithm growth", "Examples like O(1), O(N), O(N^2)", "Trade-offs between time and space"],
    },
    {
        id: "dsa3",
        category: "Data Structures & Algorithms",
        difficulty: "Medium",
        question: "Explain the difference between BFS and DFS graph traversal algorithms. When would you use each?",
        keyPoints: ["Queue vs Stack-based approaches", "BFS for shortest path in unweighted graphs", "DFS for topological sorting and cycle detection"],
    },
    {
        id: "dsa4",
        category: "Data Structures & Algorithms",
        difficulty: "Hard",
        question: "Explain how a hash table works internally. How are collisions handled?",
        keyPoints: ["Hash function maps keys to indices", "Collision resolution: chaining vs open addressing", "Load factor and rehashing"],
    },
    {
        id: "dsa5",
        category: "Data Structures & Algorithms",
        difficulty: "Hard",
        question: "What is dynamic programming? Explain the difference between memoization and tabulation with examples.",
        keyPoints: ["Overlapping subproblems and optimal substructure", "Top-down (memoization) vs bottom-up (tabulation)", "Classic examples: Fibonacci, knapsack"],
    },
    {
        id: "dsa6",
        category: "Data Structures & Algorithms",
        difficulty: "Medium",
        question: "Explain the different types of sorting algorithms and their time complexities. Which one is best for which scenario?",
        keyPoints: ["O(n log n): merge sort, quick sort", "O(n^2): bubble sort, insertion sort", "Stability and space trade-offs"],
    },

    // ─── System Design ───
    {
        id: "sys1",
        category: "System Design",
        difficulty: "Hard",
        question: "How would you design a rate limiter for a public API?",
        keyPoints: ["Token bucket or sliding window algorithm", "Distributed caching (Redis)", "Handling race conditions"],
    },
    {
        id: "sys2",
        category: "System Design",
        difficulty: "Hard",
        question: "How would you design a URL shortening service like bit.ly?",
        keyPoints: ["Unique ID generation (base62 encoding)", "Read-heavy system with caching", "Database sharding and analytics"],
    },
    {
        id: "sys3",
        category: "System Design",
        difficulty: "Medium",
        question: "Explain the concepts of horizontal vs vertical scaling. What are the trade-offs?",
        keyPoints: ["Adding more machines vs upgrading machine", "Stateless services for horizontal scaling", "Cost and complexity considerations"],
    },
    {
        id: "sys4",
        category: "System Design",
        difficulty: "Hard",
        question: "How would you design a real-time chat application like WhatsApp or Slack?",
        keyPoints: ["WebSocket connections for real-time", "Message queue for async processing", "Data sharding by conversation or user"],
    },

    // ─── Database ───
    {
        id: "db1",
        category: "Database",
        difficulty: "Medium",
        question: "Explain the ACID properties in databases. Why are they important for transactions?",
        keyPoints: ["Atomicity, Consistency, Isolation, Durability", "Ensuring data integrity", "Isolation levels (read committed, serializable)"],
    },
    {
        id: "db2",
        category: "Database",
        difficulty: "Medium",
        question: "What is database normalization? Explain first, second, and third normal forms.",
        keyPoints: ["Reducing data redundancy", "1NF: atomic values, 2NF: no partial dependencies, 3NF: no transitive dependencies", "Denormalization for performance"],
    },
    {
        id: "db3",
        category: "Database",
        difficulty: "Hard",
        question: "Compare SQL and NoSQL databases. When would you choose one over the other?",
        keyPoints: ["Structured vs flexible schema", "Vertical vs horizontal scaling", "Use cases: relational data vs document/key-value"],
    },
    {
        id: "db4",
        category: "Database",
        difficulty: "Medium",
        question: "What are database indexes? How do they improve query performance and what are their drawbacks?",
        keyPoints: ["B-tree or hash index structures", "Speed up reads, slow down writes", "Choosing the right columns to index"],
    },

    // ─── SQL ───
    {
        id: "sql1",
        category: "SQL",
        difficulty: "Easy",
        question: "Explain the different types of SQL JOINs with examples. When would you use each type?",
        keyPoints: ["INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN", "Cross join and self join", "Join conditions and performance"],
    },
    {
        id: "sql2",
        category: "SQL",
        difficulty: "Medium",
        question: "What are SQL window functions? Give examples of ROW_NUMBER, RANK, and DENSE_RANK.",
        keyPoints: ["OVER clause with PARTITION BY", "Difference between ROW_NUMBER, RANK, DENSE_RANK", "Running totals and moving averages"],
    },
    {
        id: "sql3",
        category: "SQL",
        difficulty: "Medium",
        question: "Explain the difference between WHERE and HAVING clauses in SQL. When do you use each?",
        keyPoints: ["WHERE filters rows before grouping", "HAVING filters after GROUP BY", "Aggregate functions only in HAVING"],
    },

    // ─── Java ───
    {
        id: "java1",
        category: "Java",
        difficulty: "Easy",
        question: "What is the difference between an abstract class and an interface in Java?",
        keyPoints: ["Abstract class can have implementations, interface cannot (before Java 8)", "Single vs multiple inheritance", "When to use each"],
    },
    {
        id: "java2",
        category: "Java",
        difficulty: "Medium",
        question: "Explain the Java memory model. What are the differences between stack and heap memory?",
        keyPoints: ["Stack for method calls and local variables", "Heap for objects and instance variables", "Garbage collection on heap"],
    },
    {
        id: "java3",
        category: "Java",
        difficulty: "Hard",
        question: "What is multithreading in Java? Explain synchronization and the volatile keyword.",
        keyPoints: ["Thread class vs Runnable interface", "synchronized keyword for mutual exclusion", "volatile ensures visibility across threads"],
    },
    {
        id: "java4",
        category: "Java",
        difficulty: "Medium",
        question: "Explain the Collection framework in Java. What are the differences between ArrayList, LinkedList, and HashMap?",
        keyPoints: ["List vs Set vs Map interfaces", "ArrayList O(1) access, LinkedList O(1) insertion", "HashMap key-value pairs with O(1) average lookup"],
    },

    // ─── C/C++ ───
    {
        id: "c1",
        category: "C Programming",
        difficulty: "Medium",
        question: "Explain pointers in C. What are pointer arithmetic and memory allocation with malloc?",
        keyPoints: ["Address storage and dereferencing", "Pointer arithmetic with data type sizes", "malloc/calloc/free for dynamic memory"],
    },
    {
        id: "cpp1",
        category: "C++",
        difficulty: "Medium",
        question: "What is RAII (Resource Acquisition Is Initialization) in C++? How does it help with memory management?",
        keyPoints: ["Resources tied to object lifetime", "Smart pointers: unique_ptr, shared_ptr", "Automatic cleanup via destructors"],
    },
    {
        id: "cpp2",
        category: "C++",
        difficulty: "Hard",
        question: "Explain virtual functions and polymorphism in C++. What is the vtable?",
        keyPoints: ["Runtime polymorphism via virtual functions", "vtable stores function pointers", "Pure virtual functions for abstract classes"],
    },

    // ─── Machine Learning ───
    {
        id: "ml1",
        category: "Machine Learning",
        difficulty: "Medium",
        question: "Explain the difference between supervised and unsupervised learning.",
        keyPoints: ["Labeled data vs unlabeled data", "Classification/Regression vs Clustering/Association", "Examples like predicting price vs segmenting users"],
    },
    {
        id: "ml2",
        category: "Machine Learning",
        difficulty: "Hard",
        question: "What is overfitting in machine learning? How do you prevent it?",
        keyPoints: ["Model memorizes training data", "Regularization (L1, L2)", "Cross-validation and dropout"],
    },
    {
        id: "ml3",
        category: "Machine Learning",
        difficulty: "Medium",
        question: "Explain the bias-variance tradeoff in machine learning models.",
        keyPoints: ["High bias = underfitting", "High variance = overfitting", "Finding the sweet spot with model complexity"],
    },

    // ─── DevOps & Cloud ───
    {
        id: "devops1",
        category: "DevOps",
        difficulty: "Medium",
        question: "What is Docker? Explain the difference between a Docker image and a container.",
        keyPoints: ["Containerization vs virtualization", "Image is a blueprint, container is running instance", "Dockerfile and layers"],
    },
    {
        id: "devops2",
        category: "DevOps",
        difficulty: "Hard",
        question: "Explain CI/CD pipelines. What are the key stages and best practices?",
        keyPoints: ["Continuous Integration: automated testing", "Continuous Delivery vs Continuous Deployment", "Pipeline stages: build, test, deploy"],
    },
    {
        id: "devops3",
        category: "DevOps",
        difficulty: "Medium",
        question: "What is Kubernetes? How does it help with container orchestration?",
        keyPoints: ["Pod, Service, Deployment abstractions", "Auto-scaling and self-healing", "Service discovery and load balancing"],
    },

    // ─── Behavioral ───
    {
        id: "beh1",
        category: "Behavioral",
        difficulty: "Medium",
        question: "Tell me about a time you had to resolve a conflict within your engineering team.",
        keyPoints: ["Active listening and empathy", "Focusing on data/facts rather than opinions", "Compromise and moving forward"],
    },
    {
        id: "beh2",
        category: "Behavioral",
        difficulty: "Medium",
        question: "Describe a situation where you had to learn a new technology quickly to complete a project.",
        keyPoints: ["Self-learning approach", "Time management under pressure", "Applying new knowledge effectively"],
    },
    {
        id: "beh3",
        category: "Behavioral",
        difficulty: "Medium",
        question: "Tell me about a time when you made a mistake in production. How did you handle it?",
        keyPoints: ["Accountability and ownership", "Root cause analysis", "Preventive measures taken"],
    },
    {
        id: "beh4",
        category: "Behavioral",
        difficulty: "Easy",
        question: "Why are you interested in this role and what motivates you as a software engineer?",
        keyPoints: ["Passion for technology", "Career growth alignment", "Company/role specific motivation"],
    },
    {
        id: "beh5",
        category: "Behavioral",
        difficulty: "Medium",
        question: "Describe a project where you had to work with tight deadlines. How did you prioritize tasks?",
        keyPoints: ["Task prioritization framework", "Communication with stakeholders", "Delivering MVP vs full scope"],
    },

    // ─── Communication / Self Introduction ───
    {
        id: "comm1",
        category: "Communication",
        difficulty: "Easy",
        question: "Please introduce yourself and walk me through your background and experience.",
        keyPoints: ["Structured introduction", "Relevant experience highlights", "Career trajectory and goals"],
    },
    {
        id: "comm2",
        category: "Communication",
        difficulty: "Easy",
        question: "What are your greatest strengths and how have they helped you professionally?",
        keyPoints: ["Self-awareness", "Specific examples", "Relevance to the role"],
    },
    {
        id: "comm3",
        category: "Communication",
        difficulty: "Medium",
        question: "How do you explain complex technical concepts to non-technical stakeholders?",
        keyPoints: ["Using analogies and simple language", "Visual aids and demos", "Checking for understanding"],
    },

    // ─── TypeScript ───
    {
        id: "ts1",
        category: "TypeScript",
        difficulty: "Medium",
        question: "What are generics in TypeScript? Provide an example of when you would use them.",
        keyPoints: ["Type parameters for reusable code", "Constraints with extends", "Generic interfaces and functions"],
    },
    {
        id: "ts2",
        category: "TypeScript",
        difficulty: "Medium",
        question: "Explain the difference between type aliases and interfaces in TypeScript. When would you use each?",
        keyPoints: ["Interfaces support declaration merging", "Types support union and intersection", "Both support extension"],
    },

    // ─── Next.js ───
    {
        id: "next1",
        category: "Next.js",
        difficulty: "Medium",
        question: "Explain the difference between SSR, SSG, and ISR in Next.js. When would you choose each?",
        keyPoints: ["SSR: per-request rendering", "SSG: build-time rendering", "ISR: revalidation after build"],
    },
    {
        id: "next2",
        category: "Next.js",
        difficulty: "Medium",
        question: "What is the App Router in Next.js 13+? How does it differ from the Pages Router?",
        keyPoints: ["File-based routing with layouts", "Server Components by default", "Nested layouts and loading states"],
    },

    // ─── CSS / Web Fundamentals ───
    {
        id: "web1",
        category: "Web Fundamentals",
        difficulty: "Easy",
        question: "Explain the CSS Box Model. What are the differences between margin, padding, and border?",
        keyPoints: ["Content, padding, border, margin layers", "box-sizing: border-box vs content-box", "Margin collapsing"],
    },
    {
        id: "web2",
        category: "Web Fundamentals",
        difficulty: "Medium",
        question: "What is CORS (Cross-Origin Resource Sharing)? How do you handle CORS issues?",
        keyPoints: ["Same-origin policy enforcement", "Preflight OPTIONS requests", "Access-Control-Allow-Origin headers"],
    },
    {
        id: "web3",
        category: "Web Fundamentals",
        difficulty: "Medium",
        question: "Explain the differences between cookies, localStorage, and sessionStorage.",
        keyPoints: ["Size limits and persistence", "Server-sent vs client-only", "Security considerations (httpOnly, secure flags)"],
    },

    // ─── Security ───
    {
        id: "sec1",
        category: "Security",
        difficulty: "Medium",
        question: "What are the most common web security vulnerabilities? How do you prevent XSS and SQL injection?",
        keyPoints: ["OWASP Top 10", "Input sanitization and parameterized queries", "Content Security Policy for XSS"],
    },
    {
        id: "sec2",
        category: "Security",
        difficulty: "Medium",
        question: "Explain authentication vs authorization. What are JWTs and how do they work?",
        keyPoints: ["Authentication: who you are, Authorization: what you can do", "JWT structure: header, payload, signature", "Stateless authentication benefits"],
    },

    // ─── Git & Version Control ───
    {
        id: "git1",
        category: "Git",
        difficulty: "Easy",
        question: "Explain the difference between git merge and git rebase. When would you use each?",
        keyPoints: ["Merge creates a merge commit", "Rebase rewrites commit history linearly", "Rebase for clean history, merge for preserving context"],
    },
    {
        id: "git2",
        category: "Git",
        difficulty: "Medium",
        question: "What is git stash? How do you resolve merge conflicts?",
        keyPoints: ["Stash temporarily saves uncommitted changes", "Conflict markers and manual resolution", "Using git mergetool"],
    },

    // ─── Testing ───
    {
        id: "test1",
        category: "Testing",
        difficulty: "Medium",
        question: "What are unit tests, integration tests, and end-to-end tests? Explain the testing pyramid.",
        keyPoints: ["Unit: individual functions, Integration: component interaction, E2E: full flow", "More unit tests, fewer E2E tests", "Mocking and stubbing"],
    },
    {
        id: "test2",
        category: "Testing",
        difficulty: "Medium",
        question: "What is TDD (Test-Driven Development)? What are its benefits and drawbacks?",
        keyPoints: ["Red-green-refactor cycle", "Better code design and confidence", "Can slow down initial development"],
    },
];
