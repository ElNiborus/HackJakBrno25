import logging
import sys
from pathlib import Path


def setup_logger(name: str) -> logging.Logger:
    """
    Set up a logger with file name included in the format.
    
    Args:
        name: The name of the logger (typically __name__ from the calling module)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Only add handler if logger doesn't have handlers yet
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Create console handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        
        # Create formatter that includes file name
        formatter = logging.Formatter(
            fmt='%(asctime)s - [%(filename)s:%(lineno)d] - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        
        logger.addHandler(handler)
    
    return logger
