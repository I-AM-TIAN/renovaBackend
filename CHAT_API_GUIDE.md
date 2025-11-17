# 💬 Guía de API - Chat en Tiempo Real (Frontend)

## 📋 Descripción General

Sistema de chat en tiempo real usando **WebSockets (Socket.IO)** + **REST API** para gestionar conversaciones entre usuarios sobre productos.

---

## 🔌 WebSocket Connection

### **Conectar al servidor**

```typescript
import io from 'socket.io-client';

const socket = io('http://tu-api', {
  auth: {
    token: userJwtToken, // JWT token del usuario autenticado
  },
  transports: ['websocket'],
});

// Eventos de conexión
socket.on('connect', () => {
  console.log('Conectado al servidor de chat');
});

socket.on('disconnect', () => {
  console.log('Desconectado del servidor');
});

socket.on('error', (error) => {
  console.error('Error en WebSocket:', error);
});
```

---

## 📡 Eventos WebSocket

### **1. Unirse a una conversación**

Antes de enviar/recibir mensajes, debes unirte a la conversación:

```typescript
socket.emit('joinChat', {
  conversationId: 'uuid-conversacion',
  userId: 'uuid-usuario'
});

// Respuesta del servidor
socket.on('joinedChat', (data) => {
  console.log('Unido al chat:', data);
  // { conversationId: 'uuid', message: 'Conectado al chat' }
});
```

---

### **2. Enviar mensaje**

```typescript
socket.emit('sendMessage', {
  conversationId: 'uuid-conversacion',
  message: '¿Está disponible el producto?',
  senderId: 'uuid-usuario'
});

// Confirmación de envío
socket.on('messageSent', (data) => {
  console.log('Mensaje enviado:', data);
});
```

---

### **3. Recibir mensajes nuevos**

```typescript
socket.on('newMessage', (message) => {
  console.log('Nuevo mensaje:', message);
  
  // Estructura del mensaje:
  // {
  //   id: 'uuid',
  //   content: 'Hola, ¿está disponible?',
  //   conversationId: 'uuid',
  //   sender: {
  //     id: 'uuid',
  //     nombres: 'Juan',
  //     apellidos: 'Pérez'
  //   },
  //   senderId: 'uuid',
  //   isRead: false,
  //   createdAt: '2025-11-17T10:30:00Z'
  // }
  
  // Actualizar UI con el nuevo mensaje
  setMessages(prev => [...prev, message]);
});
```

---

### **4. Indicador de "escribiendo..."**

```typescript
// Cuando el usuario empieza a escribir
socket.emit('typing', {
  conversationId: 'uuid-conversacion',
  userId: 'uuid-usuario',
  userName: 'Juan Pérez'
});

// Cuando el usuario deja de escribir
socket.emit('stopTyping', {
  conversationId: 'uuid-conversacion',
  userId: 'uuid-usuario'
});

// Escuchar cuando el otro usuario está escribiendo
socket.on('userTyping', (data) => {
  console.log(`${data.userName} está escribiendo...`);
  setIsTyping(true);
});

socket.on('userStoppedTyping', (data) => {
  setIsTyping(false);
});
```

---

### **5. Marcar mensajes como leídos**

```typescript
socket.emit('markAsRead', {
  conversationId: 'uuid-conversacion',
  userId: 'uuid-usuario'
});

// Confirmación
socket.on('markedAsRead', (data) => {
  console.log('Mensajes marcados como leídos');
});

// Notificación cuando el otro usuario lee tus mensajes
socket.on('messagesRead', (data) => {
  console.log('El otro usuario leyó los mensajes');
  // Actualizar UI (doble check azul)
});
```

---

## 🌐 REST API Endpoints

### **1. Crear o obtener conversación**

**Endpoint:** `POST /chat/conversations`  
**Autenticación:** ✅ Requerida (JWT)

```typescript
const createConversation = async (otherUserId: string, productId?: string) => {
  const response = await fetch('http://tu-api/chat/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      otherUserId,
      productId // Opcional - si el chat es sobre un producto específico
    })
  });
  
  const conversation = await response.json();
  return conversation;
};
```

**Respuesta:**
```json
{
  "id": "uuid-conversacion",
  "user1Id": "uuid",
  "user2Id": "uuid",
  "productId": "uuid",
  "lastMessage": "Último mensaje...",
  "createdAt": "2025-11-17T10:00:00Z",
  "updatedAt": "2025-11-17T10:30:00Z",
  "user1": { "id": "uuid", "nombres": "Juan", "apellidos": "Pérez" },
  "user2": { "id": "uuid", "nombres": "María", "apellidos": "García" },
  "product": {
    "id": "uuid",
    "name": "Sofá moderno",
    "images": ["url1", "url2"]
  }
}
```

---

### **2. Listar conversaciones del usuario**

**Endpoint:** `GET /chat/conversations`  
**Autenticación:** ✅ Requerida (JWT)

```typescript
const getConversations = async () => {
  const response = await fetch('http://tu-api/chat/conversations', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const conversations = await response.json();
  return conversations;
};
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "user1": {...},
    "user2": {...},
    "product": {
      "id": "uuid",
      "name": "Sofá moderno",
      "images": ["url1", "url2"]
    },
    "lastMessage": "Hola, ¿está disponible?",
    "otherUser": {
      "id": "uuid",
      "nombres": "María",
      "apellidos": "García"
    },
    "unreadCount": 3,
    "updatedAt": "2025-11-17T10:30:00Z"
  }
]
```

---

### **3. Obtener mensajes de una conversación**

**Endpoint:** `GET /chat/conversations/:id/messages?limit=50&offset=0`  
**Autenticación:** ✅ Requerida (JWT)

```typescript
const getMessages = async (conversationId: string, page: number = 0) => {
  const limit = 50;
  const offset = page * limit;
  
  const response = await fetch(
    `http://tu-api/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const messages = await response.json();
  return messages;
};
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "content": "Hola, ¿está disponible el producto?",
    "conversationId": "uuid",
    "senderId": "uuid",
    "isRead": true,
    "createdAt": "2025-11-17T10:00:00Z",
    "sender": {
      "id": "uuid",
      "nombres": "Juan",
      "apellidos": "Pérez"
    }
  }
]
```

---

### **4. Marcar mensajes como leídos (REST)**

**Endpoint:** `POST /chat/conversations/:id/read`  
**Autenticación:** ✅ Requerida (JWT)

```typescript
const markAsRead = async (conversationId: string) => {
  const response = await fetch(
    `http://tu-api/chat/conversations/${conversationId}/read`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return await response.json();
};
```

---

## 💻 Ejemplo Completo - React Native

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import io from 'socket.io-client';

const ChatScreen = ({ route }) => {
  const { conversationId, otherUser, currentUserId, token } = route.params;
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Conectar a WebSocket
    socketRef.current = io('http://tu-api', {
      auth: { token },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    // Eventos de conexión
    socket.on('connect', () => {
      console.log('Conectado');
      // Unirse a la conversación
      socket.emit('joinChat', {
        conversationId,
        userId: currentUserId,
      });
    });

    // Cargar mensajes anteriores
    loadMessages();

    // Escuchar nuevos mensajes
    socket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
      
      // Marcar como leído si es del otro usuario
      if (message.senderId !== currentUserId) {
        socket.emit('markAsRead', {
          conversationId,
          userId: currentUserId,
        });
      }
    });

    // Escuchar indicador de escritura
    socket.on('userTyping', (data) => {
      if (data.userId !== currentUserId) {
        setIsTyping(true);
      }
    });

    socket.on('userStoppedTyping', () => {
      setIsTyping(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadMessages = async () => {
    const response = await fetch(
      `http://tu-api/chat/conversations/${conversationId}/messages`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const data = await response.json();
    setMessages(data);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    socketRef.current.emit('sendMessage', {
      conversationId,
      message: newMessage,
      senderId: currentUserId,
    });

    setNewMessage('');
    
    // Detener indicador de escritura
    socketRef.current.emit('stopTyping', {
      conversationId,
      userId: currentUserId,
    });
  };

  const handleTextChange = (text) => {
    setNewMessage(text);

    // Emitir evento de escritura
    socketRef.current.emit('typing', {
      conversationId,
      userId: currentUserId,
      userName: 'Tú',
    });

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Detener indicador después de 2 segundos sin escribir
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stopTyping', {
        conversationId,
        userId: currentUserId,
      });
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Lista de mensajes */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={
            item.senderId === currentUserId 
              ? styles.myMessage 
              : styles.otherMessage
          }>
            <Text>{item.content}</Text>
            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        )}
        keyExtractor={item => item.id}
      />

      {/* Indicador de escritura */}
      {isTyping && (
        <Text style={styles.typing}>{otherUser.nombres} está escribiendo...</Text>
      )}

      {/* Input de mensaje */}
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={handleTextChange}
          placeholder="Escribe un mensaje..."
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSendMessage}>
          <Text>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

---

## 🔑 Puntos Clave

1. **Autenticación**: Siempre incluye el JWT token al conectar WebSocket
2. **Unirse al chat**: Debes emitir `joinChat` antes de enviar/recibir mensajes
3. **Sincronización**: Usa REST API para cargar historial, WebSocket para tiempo real
4. **Indicador de escritura**: Emite `stopTyping` después de 2 segundos sin actividad
5. **Mensajes leídos**: Marca como leído cuando el usuario abre el chat
6. **Desconexión**: Limpia el socket en el cleanup del componente
7. **Producto asociado**: Opcional - útil para chats sobre productos específicos

---

## 📱 Flujo de Uso Típico

1. **Usuario ve un producto** → Click en "Contactar"
2. **Frontend llama** `POST /chat/conversations` con `productId`
3. **Backend crea/obtiene** conversación
4. **Frontend navega** a ChatScreen con `conversationId`
5. **Frontend conecta** WebSocket y se une al chat
6. **Frontend carga** mensajes anteriores (REST API)
7. **Usuarios chatean** en tiempo real (WebSocket)
8. **Frontend marca** mensajes como leídos

---

## ⚠️ Manejo de Errores

```typescript
socket.on('error', (error) => {
  if (error.message.includes('Token')) {
    // Token inválido, redirigir a login
    navigation.navigate('Login');
  } else if (error.message.includes('permiso')) {
    // Sin permiso para esta conversación
    alert('No tienes acceso a este chat');
    navigation.goBack();
  } else {
    // Error genérico
    alert('Error en el chat: ' + error.message);
  }
});
```

---

## 📞 Soporte

**Backend URL:** `http://tu-api`  
**WebSocket Path:** `/socket.io/`  
**Última actualización:** Noviembre 2025
