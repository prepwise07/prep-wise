# Use Ubuntu as the base
FROM ubuntu:22.04

# Avoid prompts for timezone
ENV DEBIAN_FRONTEND=noninteractive

# Update and install essential tools
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    gcc \
    g++ \
    python3 \
    python3-pip \
    python-is-python3 \
    openjdk-17-jdk \
    nodejs \
    npm \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Set up a non-root user for security
RUN useradd -m -s /bin/bash runner
USER runner
WORKDIR /home/runner

# Verify installations
RUN gcc --version && \
    g++ --version && \
    python3 --version && \
    java -version && \
    node -v && \
    go version && \
    rustc --version

CMD ["bash"]
