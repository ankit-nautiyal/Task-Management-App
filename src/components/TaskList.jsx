import { Button, Checkbox, FormControlLabel, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { deleteTodo, deleteAll, markAsDone, markAllAsDone, editTodo, updateTodoOrder, addTodo, setStatus, setFilterOption } from "../features/taskSlice.jsx";
import { setPriority } from "../features/taskSlice.jsx";
import TaskInput from "./TaskInput.jsx";
import { useEffect, useState, useCallback } from "react";
import WeatherInfo from "./WeatherInfo.jsx";
import { clearWeatherError } from "../features/weatherSlice.jsx";
import { fetchWeather } from "../api/weatherAPI.js";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import styles from '../styles/TaskList.module.css';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PriorityMenu from "./PriorityMenu.jsx";
import StatusMenu from "./StatusMenu.jsx";
import { toast } from "react-toastify";



const outdoorKeywords = ["swim", "walk", "run", "office", "school", "college", "shopping", "market", "meet", "go", "drive", "gym", "attend"]; //can be updated later

    
export default function TaskList(){

    const todos= useSelector((state) => state.todo.todos);
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const city = useSelector((state) => state.auth.city);  // Get user city from Redux store
    const weather = useSelector((state) => state.weather?.data);  // to handle undefined case also
    const weatherError = useSelector((state) => state.weather?.error);  // Get weather error
    const dispatch= useDispatch();
    const [outdoorTaskDetected, setOutdoorTaskDetected] = useState(false);
    const [filteredTodos, setFilteredTodos] = useState([]);
    const filterOption = useSelector(state => state.todo.filterOption);


    useEffect(() => {
        let filteredList = [...todos];

        switch (filterOption) {
            case "latest-first":
                filteredList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case "oldest-first":
                filteredList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case "high-low":
                filteredList.sort((a, b) => {
                    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
                    return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
                });
                break;
            case "low-high":
                filteredList.sort((a, b) => {
                    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
                    return (priorityOrder[b.priority] || 4) - (priorityOrder[a.priority] || 4);
                });
                break;
            case "high":
                filteredList = filteredList.filter((todo) => todo.priority === "High");
                break;
            case "medium":
                filteredList = filteredList.filter((todo) => todo.priority === "Medium");
                break;
            case "low":
                filteredList = filteredList.filter((todo) => todo.priority === "Low");
                break;

            case "todo":
            case "in-progress":
            case "done":
                filteredList = filteredList.filter(todo => todo.status === filterOption);
                break;
            case "": // Reset case
            default:
                filteredList = todos; // Show original order, by default
        }

        setFilteredTodos(filteredList);
    }, [todos, filterOption]);

    
    // To ennsure Redux store is in sync with localStorage when the app starts
    useEffect(() => {
        if (todos.length === 0) {
            const savedTodos = localStorage.getItem("todos");
            if (savedTodos) {
                JSON.parse(savedTodos).forEach(todo => dispatch(addTodo(todo.task)));
            }
        }
    }, [dispatch]);  

    useEffect(() => {
        localStorage.setItem("todos", JSON.stringify(todos));

         // Save authentication status to localStorage
        localStorage.setItem("isAuthenticated", JSON.stringify(isAuthenticated));
    }, [todos, isAuthenticated]);

    
    //  Check if there's any outdoor task & fetch weather
    useEffect(() => {

        const hasOutdoorTask = todos.some(todo =>
            outdoorKeywords.some(keyword => todo.task.toLowerCase().includes(keyword))
        );



        if (hasOutdoorTask && city) {
            console.log(`Fetching weather for city: ${city}`); // Debugging log
            dispatch(fetchWeather(city));
            setOutdoorTaskDetected(true);
        } else {
            setOutdoorTaskDetected(false);
            dispatch(clearWeatherError());  // Clear error if no outdoor task
        }
    }, [todos, city]);

    const handleDelete = useCallback((id) => {
        if (confirm("Do you really want to delete this task?")) {
            dispatch(deleteTodo(id));
            toast.success("Task deleted successfully!");
        }
    }, [dispatch]);  // Only changes if dispatch changes
    



    const handleMarkAsDone= (id)=>{
        dispatch(markAsDone(id));   // This will toggle isDone and sync status
    }


    const handleEdit= (id) =>{
        dispatch(editTodo(id));
        toast.success("Task edited successfully!");
    }


    const handlePriorityChange = (id, priority) => {
        dispatch(setPriority({ id, priority }));
    };



    const handleDragEnd = useCallback((result) => {
        if (!result.destination) return;
    
        const reorderedTodos = [...todos];
        const [movedTodo] = reorderedTodos.splice(result.source.index, 1);
        reorderedTodos.splice(result.destination.index, 0, movedTodo);
    
        setFilteredTodos(reorderedTodos);
        dispatch(updateTodoOrder(reorderedTodos));

        // localStorage.setItem("todos", JSON.stringify(reorderedTodos));
    }, [todos, dispatch]);
    

    const handleStatusChange = (id, status) => {
        dispatch(setStatus({ id, status }));    // This will update status and sync isDone
    };

    const handleDeleteAll = () => {
        if (todos.length === 0) {
            toast.info("No tasks to delete!");
            return;
        }
        if (confirm("Are you sure you want to delete all tasks? This cannot be undone.")) {
            dispatch(deleteAll());
            toast.success("All tasks deleted successfully!");
        }
    };

    const handleMarkAllAsDone = () => {
        if (todos.length === 0) {
            toast.info("No tasks to mark as done!");
            return;
        }
        if (confirm("Are you sure you want to mark all tasks as done?")) {
            dispatch(markAllAsDone());
            toast.success("All tasks marked as done!");
        }
    };
    
    

    return(
        <> 
            
            <div className={styles.taskListContainer}>
                <TaskInput/>
                
                {isAuthenticated && (
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            mb: 2,
                            justifyContent: "flex-start",
                        }}
                    >
                        <Button
                            variant="outlined"
                            sx={{
                                color: "red",
                                borderColor: "red",
                                borderRadius: "15px",
                                fontSize: "10px",
                                padding: "4px 8px",
                            }}
                            onClick={handleDeleteAll}
                        >
                            <DeleteIcon sx={{ height: "15px", width: "15px", mr: 0.5 }} />
                            Delete All
                        </Button>

                        <Button
                            variant="outlined"
                            sx={{
                                color: "green",
                                borderColor: "green",
                                borderRadius: "15px",
                                fontSize: "10px",
                                padding: "4px 8px",
                            }}
                            onClick={handleMarkAllAsDone}
                        >
                    
                            ✅ Mark All As Done
                        </Button>
                    </Box>
                )}
                {outdoorTaskDetected && weather && <WeatherInfo weather={weather} error={weatherError && "Invalid city name!"} />}

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="todoList">

                        {(provided) => (

                            <ol className={styles.taskList} {...provided.droppableProps} ref={provided.innerRef}>
                                {filteredTodos.map((todo, index) => ( 
                                    
                                    <Draggable key={todo.id} draggableId={todo.id.toString()} index={index}>
                                        {(provided) => (
                                            <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={styles.taskItem}>
                                                
                                                <div className={styles.taskRow}>
                                                    <FormControlLabel 
                                                        control={<Checkbox  color="success" onChange={() => handleMarkAsDone(todo.id)} checked={todo.isDone} />}
                                                        label={<span className={todo.isDone ? styles.done : ""}> {todo.task} </span> } 
                                                    />
                                                
                                                    

                                                    <div  className={styles.taskButtons}>
                                                        <Button className={styles.editBtn}  variant="outlined" onClick={() => handleEdit(todo.id)}> 
                                                            <EditIcon sx={{width: '17px', height: '17px'}} /> Edit
                                                        </Button>

                                                        <Button className={styles.dltBtn}  variant="outlined" onClick={() => handleDelete(todo.id)}> 
                                                            <DeleteIcon sx={{width: '17px', height: '17px'}} /> Delete 
                                                        </Button>
                                                    </div>
                                        
                                                </div>
                                                
                                                <hr />

                                                <div className={styles.todoMenus}>
                                                    <span> <PriorityMenu priority={todo.priority} onChange={(newPriority) => handlePriorityChange(todo.id, newPriority)}  /></span>
                                                    <span> <StatusMenu status={todo.status} onChange={(newStatus) => handleStatusChange(todo.id, newStatus)} /></span>
                                                    
                                                    
                                                </div>
                                                
                                                

                                            </li>
                                        )}
                                        
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ol>
                        )}

                    </Droppable>
                </DragDropContext>
            
            </div>  

        
        </>
    );
}